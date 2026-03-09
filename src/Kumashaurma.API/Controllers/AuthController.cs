using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.DTOs.Auth;
using Kumashaurma.API.Models;
using Kumashaurma.API.Services;
using Kumashaurma.API.Data;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IVerificationService _verificationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            IVerificationService verificationService,
            ApplicationDbContext context,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _verificationService = verificationService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Отправить SMS-код для верификации телефона
        /// </summary>
        [HttpPost("send-code")]
        public async Task<ActionResult<SendCodeResponseDto>> SendCode([FromBody] SendCodeDto dto)
        {
            var (success, message, retryAfter) = await _verificationService.CreateAndSendCodeAsync(dto.Phone);

            if (!success)
            {
                return BadRequest(new SendCodeResponseDto
                {
                    Success = false,
                    Message = message,
                    RetryAfter = retryAfter
                });
            }

            return Ok(new SendCodeResponseDto
            {
                Success = true,
                Message = message
            });
        }

        /// <summary>
        /// Проверить SMS-код и получить токены (для уже зарегистрированных)
        /// </summary>
        [HttpPost("verify")]
        public async Task<ActionResult<AuthResponseDto>> VerifyCode([FromBody] VerifyCodeDto dto)
        {
            var (verifySuccess, verifyMessage) = await _verificationService.VerifyCodeAsync(dto.Phone, dto.Code);

            if (!verifySuccess)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = verifyMessage
                });
            }

            // Нормализуем телефон для поиска пользователя
            var normalizedPhone = NormalizePhone(dto.Phone);

            // Ищем пользователя
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);

            if (user == null)
            {
                // Пользователь не найден - нужно зарегистрироваться
                return Ok(new AuthResponseDto
                {
                    Success = true,
                    Message = "Телефон подтверждён. Завершите регистрацию."
                });
            }

            // Обновляем статус верификации
            if (!user.PhoneVerified)
            {
                user.PhoneVerified = true;
                user.UpdatedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
            }

            // Генерируем токены
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken(user.Id, GetIpAddress());

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Успешный вход",
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserDto
                {
                    Id = user.Id,
                    Phone = user.PhoneNumber ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneVerified = user.PhoneVerified,
                    Roles = roles
                }
            });
        }

        /// <summary>
        /// Регистрация нового пользователя (после верификации телефона)
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            var normalizedPhone = NormalizePhone(dto.Phone);

            // Проверяем, что телефон был верифицирован
            var verificationCode = await _context.SmsVerificationCodes
                .Where(c => c.Phone == normalizedPhone && c.VerifiedAt != null)
                .OrderByDescending(c => c.VerifiedAt)
                .FirstOrDefaultAsync();

            if (verificationCode == null)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Сначала подтвердите номер телефона"
                });
            }

            // Проверяем, что верификация была недавно (в течение 10 минут)
            if ((DateTime.UtcNow - verificationCode.VerifiedAt!.Value).TotalMinutes > 10)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Время подтверждения истекло. Запросите новый код"
                });
            }

            // Проверяем, не зарегистрирован ли уже пользователь
            var existingUser = await _userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);

            if (existingUser != null)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Пользователь с таким телефоном уже зарегистрирован"
                });
            }

            // Создаём пользователя
            var user = new AppUser
            {
                UserName = normalizedPhone,
                PhoneNumber = normalizedPhone,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                PhoneVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }

            // Добавляем роль пользователя
            await _userManager.AddToRoleAsync(user, AppRoles.User);

            // Генерируем токены
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken(user.Id, GetIpAddress());

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Новый пользователь зарегистрирован: {Phone}", normalizedPhone);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Регистрация успешна",
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserDto
                {
                    Id = user.Id,
                    Phone = user.PhoneNumber ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneVerified = user.PhoneVerified,
                    Roles = roles
                }
            });
        }

        /// <summary>
        /// Обновить access token по refresh token
        /// </summary>
        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            var storedRefreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

            if (storedRefreshToken == null)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Недействительный refresh token"
                });
            }

            if (!storedRefreshToken.IsActive)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = storedRefreshToken.IsRevoked 
                        ? "Refresh token был отозван" 
                        : "Refresh token истёк"
                });
            }

            var user = storedRefreshToken.User;

            // Отзываем старый refresh token
            storedRefreshToken.RevokedAt = DateTime.UtcNow;
            storedRefreshToken.RevokedByIp = GetIpAddress();

            // Генерируем новые токены
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id, GetIpAddress());

            storedRefreshToken.ReplacedByToken = newRefreshToken.Token;
            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserDto
                {
                    Id = user.Id,
                    Phone = user.PhoneNumber ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneVerified = user.PhoneVerified,
                    Roles = roles
                }
            });
        }

        /// <summary>
        /// Выход (отзыв refresh token)
        /// </summary>
        [HttpPost("logout")]
        public async Task<ActionResult> Logout([FromBody] RefreshTokenDto dto)
        {
            var storedRefreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

            if (storedRefreshToken != null)
            {
                storedRefreshToken.RevokedAt = DateTime.UtcNow;
                storedRefreshToken.RevokedByIp = GetIpAddress();
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Вы успешно вышли из системы" });
        }

        /// <summary>
        /// Получить информацию о текущем пользователе
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Phone = user.PhoneNumber ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneVerified = user.PhoneVerified,
                Roles = roles
            });
        }

        private string GetIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private static string NormalizePhone(string phone)
        {
            var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
            
            if (digits.StartsWith("8") && digits.Length == 11)
            {
                digits = "+7" + digits[1..];
            }
            
            if (!digits.StartsWith("+"))
            {
                digits = "+7" + digits;
            }

            return digits;
        }
    }
}
