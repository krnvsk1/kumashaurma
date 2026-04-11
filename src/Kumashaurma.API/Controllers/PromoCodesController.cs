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
    public class PromoCodesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PromoCodesController> _logger;

        public PromoCodesController(ApplicationDbContext context, ILogger<PromoCodesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ==================== Публичные эндпоинты ====================

        /// <summary>
        /// Проверить промокод — доступно всем
        /// POST /api/promocodes/validate
        /// </summary>
        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] ValidatePromoCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                    return BadRequest(new { Message = "Введите промокод" });

                var code = request.Code.Trim().ToUpper();

                var promoCode = await _context.PromoCodes
                    .FirstOrDefaultAsync(p => p.Code == code && p.IsActive);

                if (promoCode == null)
                    return NotFound(new { Message = "Промокод не найден", Valid = false });

                if (!promoCode.IsValid(request.OrderAmount))
                {
                    var reason = GetInvalidReason(promoCode, request.OrderAmount);
                    return Ok(new ValidatePromoCodeResponse
                    {
                        Valid = false,
                        Message = reason
                    });
                }

                var discount = promoCode.CalculateDiscount(request.OrderAmount);

                return Ok(new ValidatePromoCodeResponse
                {
                    Valid = true,
                    PromoCodeId = promoCode.Id,
                    Code = promoCode.Code,
                    DiscountType = promoCode.DiscountType,
                    DiscountValue = promoCode.DiscountValue,
                    DiscountAmount = discount,
                    Message = promoCode.DiscountType == "percent"
                        ? $"Скидка {promoCode.DiscountValue}% (−{discount} ₽)"
                        : $"Скидка {promoCode.DiscountValue} ₽"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при валидации промокода");
                return StatusCode(500, new { Message = "Ошибка сервера" });
            }
        }

        // ==================== Админские эндпоинты ====================

        /// <summary>
        /// Получить все промокоды (админ)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var promoCodes = await _context.PromoCodes
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                return Ok(promoCodes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении промокодов");
                return StatusCode(500, new { Message = "Ошибка сервера" });
            }
        }

        /// <summary>
        /// Создать промокод (админ)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Create([FromBody] CreatePromoCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                    return BadRequest(new { Message = "Код промокода обязателен" });

                var code = request.Code.Trim().ToUpper();

                // Проверяем уникальность кода
                var exists = await _context.PromoCodes.AnyAsync(p => p.Code == code);
                if (exists)
                    return BadRequest(new { Message = "Промокод с таким кодом уже существует" });

                // Получаем ID текущего пользователя
                int? createdBy = null;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
                {
                    createdBy = parsedUserId;
                }

                var promoCode = new PromoCode
                {
                    Code = code,
                    DiscountType = request.DiscountType ?? "percent",
                    DiscountValue = request.DiscountValue,
                    MinOrderAmount = request.MinOrderAmount,
                    MaxDiscountAmount = request.MaxDiscountAmount,
                    MaxUses = request.MaxUses,
                    CurrentUses = 0,
                    ValidFrom = request.ValidFrom,
                    ValidUntil = request.ValidUntil,
                    IsActive = request.IsActive ?? true,
                    CreatedBy = createdBy
                };

                await _context.PromoCodes.AddAsync(promoCode);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Промокод создан: {Code}, скидка: {Discount}",
                    promoCode.Code, $"{promoCode.DiscountValue}{(promoCode.DiscountType == "percent" ? "%" : " ₽")}");

                return CreatedAtAction(nameof(GetAll), new { id = promoCode.Id }, promoCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании промокода");
                return StatusCode(500, new { Message = "Ошибка сервера" });
            }
        }

        /// <summary>
        /// Обновить промокод (админ)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePromoCodeRequest request)
        {
            try
            {
                var promoCode = await _context.PromoCodes.FindAsync(id);
                if (promoCode == null)
                    return NotFound(new { Message = "Промокод не найден" });

                if (!string.IsNullOrEmpty(request.Code))
                    promoCode.Code = request.Code.Trim().ToUpper();

                if (request.DiscountType != null)
                    promoCode.DiscountType = request.DiscountType;

                if (request.DiscountValue.HasValue)
                    promoCode.DiscountValue = request.DiscountValue.Value;

                if (request.MinOrderAmount.HasValue)
                    promoCode.MinOrderAmount = request.MinOrderAmount.Value;

                promoCode.MaxDiscountAmount = request.MaxDiscountAmount;
                promoCode.MaxUses = request.MaxUses;
                promoCode.ValidFrom = request.ValidFrom;
                promoCode.ValidUntil = request.ValidUntil;

                if (request.IsActive.HasValue)
                    promoCode.IsActive = request.IsActive.Value;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Промокод обновлён: {Code}", promoCode.Code);

                return Ok(promoCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении промокода ID {Id}", id);
                return StatusCode(500, new { Message = "Ошибка сервера" });
            }
        }

        /// <summary>
        /// Удалить промокод (админ)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var promoCode = await _context.PromoCodes.FindAsync(id);
                if (promoCode == null)
                    return NotFound(new { Message = "Промокод не найден" });

                // Проверяем, не привязан ли промокод к заказам
                var orderCount = await _context.Orders.CountAsync(o => o.PromoCodeId == id);
                if (orderCount > 0)
                {
                    // Вместо удаления — деактивируем
                    promoCode.IsActive = false;
                    await _context.SaveChangesAsync();
                    return Ok(new { Message = $"Промокод деактивирован (использован в {orderCount} заказах)" });
                }

                _context.PromoCodes.Remove(promoCode);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Промокод удалён: {Code}", promoCode.Code);

                return Ok(new { Message = "Промокод удалён" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении промокода ID {Id}", id);
                return StatusCode(500, new { Message = "Ошибка сервера" });
            }
        }

        // ==================== DTOs ====================

        public class ValidatePromoCodeRequest
        {
            public string Code { get; set; } = string.Empty;
            public decimal OrderAmount { get; set; }
        }

        public class ValidatePromoCodeResponse
        {
            public bool Valid { get; set; }
            public string Message { get; set; } = string.Empty;
            public int? PromoCodeId { get; set; }
            public string? Code { get; set; }
            public string? DiscountType { get; set; }
            public decimal DiscountValue { get; set; }
            public decimal DiscountAmount { get; set; }
        }

        public class CreatePromoCodeRequest
        {
            public string Code { get; set; } = string.Empty;
            public string? DiscountType { get; set; } // "percent" or "fixed"
            public decimal DiscountValue { get; set; }
            public decimal MinOrderAmount { get; set; }
            public decimal? MaxDiscountAmount { get; set; }
            public int? MaxUses { get; set; }
            public DateTime? ValidFrom { get; set; }
            public DateTime? ValidUntil { get; set; }
            public bool? IsActive { get; set; }
        }

        public class UpdatePromoCodeRequest
        {
            public string? Code { get; set; }
            public string? DiscountType { get; set; }
            public decimal? DiscountValue { get; set; }
            public decimal? MinOrderAmount { get; set; }
            public decimal? MaxDiscountAmount { get; set; }
            public int? MaxUses { get; set; }
            public DateTime? ValidFrom { get; set; }
            public DateTime? ValidUntil { get; set; }
            public bool? IsActive { get; set; }
        }

        // ==================== Helpers ====================

        private static string GetInvalidReason(PromoCode promoCode, decimal orderTotal)
        {
            if (!promoCode.IsActive)
                return "Промокод неактивен";

            if (promoCode.MaxUses.HasValue && promoCode.CurrentUses >= promoCode.MaxUses.Value)
                return "Промокод уже исчерпан";

            var now = DateTime.UtcNow;
            if (promoCode.ValidFrom.HasValue && now < promoCode.ValidFrom.Value)
                return $"Промокод действует с {promoCode.ValidFrom.Value:dd.MM.yyyy}";

            if (promoCode.ValidUntil.HasValue && now > promoCode.ValidUntil.Value)
                return "Срок действия промокода истёк";

            if (orderTotal < promoCode.MinOrderAmount)
                return $"Минимальная сумма заказа для применения — {promoCode.MinOrderAmount} ₽";

            return "Промокод не может быть применён";
        }
    }
}
