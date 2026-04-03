using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.DTOs.Auth;
using Kumashaurma.API.Models;
using Kumashaurma.API.Services;

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
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            IVerificationService verificationService,
            ApplicationDbContext context,
            ILogger<AuthController> logger,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _verificationService = verificationService;
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Отправить SMS-код для верификации телефона
        /// </summary>
        [HttpPost("send-code")]
        [ProducesResponseType(typeof(SendCodeResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(SendCodeResponseDto), StatusCodes.Status400BadRequest)]
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
        /// Проверить SMS-код (вход для существующих пользователей)
        /// </summary>
        [HttpPost("verify")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponseDto>> VerifyCode([FromBody] VerifyCodeDto dto)
        {
            var normalizedPhone = NormalizePhone(dto.Phone);

            var (verifySuccess, verifyMessage) = await _verificationService.VerifyCodeAsync(dto.Phone, dto.Code);

            if (!verifySuccess)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = verifyMessage
                });
            }

            // Ищем пользователя
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);

            if (user == null)
            {
                // Пользователь не найден - нужно зарегистрироваться
                return Ok(new AuthResponseDto
                {
                    Success = true,
                    Message = "Phone verified. Complete registration."
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
                Message = "Login successful",
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpirationMinutes()),
                User = MapToUserDto(user, roles)
            });
        }

        /// <summary>
        /// Регистрация нового пользователя (после верификации телефона)
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
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
                    Message = "Please verify your phone number first"
                });
            }

            // Проверяем, что верификация была недавно (в течение 10 минут)
            if ((DateTime.UtcNow - verificationCode.VerifiedAt!.Value).TotalMinutes > 10)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Verification expired. Request a new code"
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
                    Message = "User with this phone already exists"
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

            _logger.LogInformation("New user registered: {Phone}", normalizedPhone);

            return Ok(new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpirationMinutes()),
                User = MapToUserDto(user, roles)
            });
        }

        /// <summary>
        /// Обновить access token по refresh token
        /// </summary>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
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
                    Message = "Invalid refresh token"
                });
            }

            if (!storedRefreshToken.IsActive)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = storedRefreshToken.IsRevoked
                        ? "Refresh token was revoked"
                        : "Refresh token expired"
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
                ExpiresAt = DateTime.UtcNow.AddMinutes(GetTokenExpirationMinutes()),
                User = MapToUserDto(user, roles)
            });
        }

        /// <summary>
        /// Выход (отзыв refresh token)
        /// </summary>
        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
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

            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Получить информацию о текущем пользователе
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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

            return Ok(MapToUserDto(user, roles));
        }

        private string GetIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private int GetTokenExpirationMinutes()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            return int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");
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

        private static UserDto MapToUserDto(AppUser user, IList<string> roles)
        {
            return new UserDto
            {
                Id = user.Id,
                Phone = user.PhoneNumber ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneVerified = user.PhoneVerified,
                Roles = roles
            };
        }
    }
}
