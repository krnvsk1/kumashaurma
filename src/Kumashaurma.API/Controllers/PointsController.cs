using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PointsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PointsController> _logger;

        public PointsController(ApplicationDbContext context, ILogger<PointsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // DTOs
        public class GrantPointsRequest
        {
            public int UserId { get; set; }
            public int Amount { get; set; }
            public string? Description { get; set; }
        }

        public class RedeemPointsRequest
        {
            public int PointsToRedeem { get; set; }
        }

        /// <summary>
        /// Получить текущий баланс баллов авторизованного пользователя
        /// </summary>
        [HttpGet("balance")]
        [Authorize]
        public async Task<IActionResult> GetMyBalance()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "Пользователь не авторизован" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { Message = "Пользователь не найден" });

                return Ok(new
                {
                    UserId = user.Id,
                    Balance = user.PointsBalance
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении баланса пользователя");
                return StatusCode(500, new { Message = "Ошибка сервера при получении баланса" });
            }
        }

        /// <summary>
        /// Получить историю транзакций авторизованного пользователя
        /// </summary>
        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetMyHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "Пользователь не авторизован" });
                }

                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var query = _context.UserPointsTransactions
                    .Where(t => t.UserId == userId);

                var total = await query.CountAsync();

                var transactions = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    Total = total,
                    Page = page,
                    PageSize = pageSize,
                    Transactions = transactions
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении истории транзакций");
                return StatusCode(500, new { Message = "Ошибка сервера при получении истории" });
            }
        }

        /// <summary>
        /// Получить баланс любого пользователя (для админа/менеджера)
        /// </summary>
        [HttpGet("users/{userId}/balance")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> GetUserBalance(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { Message = $"Пользователь с ID {userId} не найден" });

                return Ok(new
                {
                    UserId = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Phone = user.PhoneNumber,
                    Balance = user.PointsBalance
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении баланса пользователя ID {UserId}", userId);
                return StatusCode(500, new { Message = "Ошибка сервера при получении баланса" });
            }
        }

        /// <summary>
        /// Начислить/списать баллы пользователю (для админа)
        /// </summary>
        [HttpPost("admin/grant")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AdminGrantPoints([FromBody] GrantPointsRequest request)
        {
            try
            {
                if (request.Amount == 0)
                    return BadRequest(new { Message = "Количество баллов не может быть равно 0" });

                if (request.UserId <= 0)
                    return BadRequest(new { Message = "Укажите корректный ID пользователя" });

                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                    return NotFound(new { Message = $"Пользователь с ID {request.UserId} не найден" });

                // Получаем ID администратора
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? adminId = null;
                if (!string.IsNullOrEmpty(adminIdClaim) && int.TryParse(adminIdClaim, out var parsedAdminId))
                {
                    adminId = parsedAdminId;
                }

                if (request.Amount < 0)
                {
                    // Списание баллов — проверяем достаточность
                    if (user.PointsBalance + request.Amount < 0)
                        return BadRequest(new { Message = $"Недостаточно баллов. Текущий баланс: {user.PointsBalance}" });
                }

                user.PointsBalance += request.Amount;

                var transactionType = request.Amount > 0 ? "admin_grant" : "admin_deduct";
                var description = request.Description ??
                    (request.Amount > 0
                        ? $"Ручное начисление от администратора"
                        : $"Ручное списание администратором");

                var transaction = new UserPointsTransaction
                {
                    UserId = user.Id,
                    Type = transactionType,
                    Amount = request.Amount,
                    Description = description,
                    PerformedBy = adminId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserPointsTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🏆 Админ {AdminId} {Action} {Amount} баллов пользователю {UserId}",
                    adminId, request.Amount > 0 ? "начислил" : "списал", Math.Abs(request.Amount), user.Id);

                return Ok(new
                {
                    Message = request.Amount > 0
                        ? $"Начислено {request.Amount} баллов пользователю {user.FirstName} {user.LastName}"
                        : $"Списано {Math.Abs(request.Amount)} баллов у пользователя {user.FirstName} {user.LastName}",
                    UserId = user.Id,
                    NewBalance = user.PointsBalance,
                    TransactionId = transaction.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при ручном начислении/списании баллов");
                return StatusCode(500, new { Message = "Ошибка сервера при операции с баллами" });
            }
        }

        /// <summary>
        /// Потратить баллы на скидку (1 балл = 1 рубль)
        /// </summary>
        [HttpPost("redeem")]
        [Authorize]
        public async Task<IActionResult> RedeemPoints([FromBody] RedeemPointsRequest request)
        {
            try
            {
                if (request.PointsToRedeem <= 0)
                    return BadRequest(new { Message = "Количество баллов для списания должно быть больше 0" });

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "Пользователь не авторизован" });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { Message = "Пользователь не найден" });

                if (user.PointsBalance < request.PointsToRedeem)
                    return BadRequest(new { Message = $"Недостаточно баллов. Текущий баланс: {user.PointsBalance}, запрошено: {request.PointsToRedeem}" });

                user.PointsBalance -= request.PointsToRedeem;

                var transaction = new UserPointsTransaction
                {
                    UserId = user.Id,
                    Type = "spent",
                    Amount = -request.PointsToRedeem,
                    Description = $"Списание баллов для скидки",
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserPointsTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                _logger.LogInformation("💸 Пользователь {UserId} потратил {Points} баллов на скидку",
                    userId, request.PointsToRedeem);

                return Ok(new
                {
                    PointsRedeemed = request.PointsToRedeem,
                    DiscountAmount = request.PointsToRedeem, // 1 балл = 1 рубль
                    NewBalance = user.PointsBalance,
                    TransactionId = transaction.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при списании баллов пользователем");
                return StatusCode(500, new { Message = "Ошибка сервера при списании баллов" });
            }
        }
    }
}
