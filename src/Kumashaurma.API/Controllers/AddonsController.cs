using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AddonsController> _logger;

        public AddonsController(ApplicationDbContext context, ILogger<AddonsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/addons/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                var categories = await _context.AddonCategories
                    .Include(c => c.Addons)
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении категорий добавок");
                return StatusCode(500, new { Message = "Ошибка при получении категорий" });
            }
        }

        // GET: api/addons/categories/{id}
        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            try
            {
                var category = await _context.AddonCategories
                    .Include(c => c.Addons)
                    .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

                if (category == null)
                    return NotFound(new { Message = $"Категория с ID {id} не найдена" });

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении категории {CategoryId}", id);
                return StatusCode(500, new { Message = "Ошибка при получении категории" });
            }
        }

        // POST: api/addons/categories
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] AddonCategory category)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(category.Name))
                    return BadRequest(new { Message = "Название категории обязательно" });

                category.CreatedAt = DateTime.UtcNow;
                category.IsActive = true;

                _context.AddonCategories.Add(category);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Создана категория добавок: {CategoryName} (ID: {CategoryId})", 
                    category.Name, category.Id);

                return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании категории");
                return StatusCode(500, new { Message = "Ошибка при создании категории" });
            }
        }

        // PUT: api/addons/categories/{id}
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] AddonCategory updatedCategory)
        {
            try
            {
                var category = await _context.AddonCategories.FindAsync(id);
                if (category == null)
                    return NotFound(new { Message = $"Категория с ID {id} не найдена" });

                category.Name = updatedCategory.Name ?? category.Name;
                category.Description = updatedCategory.Description ?? category.Description;
                category.IsRequired = updatedCategory.IsRequired;
                category.MinSelections = updatedCategory.MinSelections;
                category.MaxSelections = updatedCategory.MaxSelections;
                category.DisplayOrder = updatedCategory.DisplayOrder;
                category.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("🔄 Обновлена категория добавок: {CategoryName} (ID: {CategoryId})", 
                    category.Name, category.Id);

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении категории {CategoryId}", id);
                return StatusCode(500, new { Message = "Ошибка при обновлении категории" });
            }
        }

        // DELETE: api/addons/categories/{id}
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.AddonCategories.FindAsync(id);
                if (category == null)
                    return NotFound(new { Message = $"Категория с ID {id} не найдена" });

                // Soft delete - просто деактивируем
                category.IsActive = false;
                category.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();

                _logger.LogInformation("🗑️ Деактивирована категория добавок: {CategoryName} (ID: {CategoryId})", 
                    category.Name, category.Id);

                return Ok(new { Message = "Категория удалена" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении категории {CategoryId}", id);
                return StatusCode(500, new { Message = "Ошибка при удалении категории" });
            }
        }

        // ==================== ADDONS ====================

        // GET: api/addons
        [HttpGet]
        public async Task<IActionResult> GetAllAddons()
        {
            try
            {
                var addons = await _context.Addons
                    .Include(a => a.Category)
                    .Where(a => a.IsAvailable)
                    .OrderBy(a => a.Name)
                    .ToListAsync();

                return Ok(addons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении добавок");
                return StatusCode(500, new { Message = "Ошибка при получении добавок" });
            }
        }

        // GET: api/addons/shawarma/{shawarmaId}
        [HttpGet("shawarma/{shawarmaId}")]
        public async Task<IActionResult> GetAddonsForShawarma(int shawarmaId)
        {
            try
            {
                var shawarma = await _context.Shawarmas
                    .Include(s => s.Addons)
                        .ThenInclude(sa => sa.Addon)
                        .ThenInclude(a => a.Category)
                    .FirstOrDefaultAsync(s => s.Id == shawarmaId);

                if (shawarma == null)
                    return NotFound(new { Message = "Шаурма не найдена" });

                var categories = shawarma.Addons
                    .Where(sa => sa.Addon.IsAvailable && sa.Addon.Category.IsActive)
                    .GroupBy(sa => sa.Addon.Category)
                    .Select(g => new
                    {
                        Id = g.Key.Id,
                        Name = g.Key.Name,
                        Description = g.Key.Description,
                        IsRequired = g.Key.IsRequired,
                        MinSelections = g.Key.MinSelections,
                        MaxSelections = g.Key.MaxSelections,
                        Addons = g.Select(sa => new
                        {
                            Id = sa.Addon.Id,
                            Name = sa.Addon.Name,
                            Description = sa.Addon.Description,
                            Price = sa.CustomPrice ?? sa.Addon.Price,
                            IsAvailable = sa.Addon.IsAvailable,
                            MaxQuantity = sa.MaxQuantity,
                            IsDefault = sa.IsDefault
                        }).OrderBy(a => a.Name).ToList()
                    })
                    .OrderBy(c => c.Name)
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении добавок для шаурмы {ShawarmaId}", shawarmaId);
                return StatusCode(500, new { Message = "Ошибка при получении добавок" });
            }
        }

        // POST: api/addons
        public class CreateAddonDto
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public int AddonCategoryId { get; set; }
            public bool IsAvailable { get; set; } = true;
            public int DisplayOrder { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAddon([FromBody] CreateAddonDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { Message = "Название добавки обязательно" });

                var category = await _context.AddonCategories.FindAsync(dto.AddonCategoryId);
                if (category == null)
                    return BadRequest(new { Message = "Категория не найдена" });

                var addon = new Addon
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    AddonCategoryId = dto.AddonCategoryId,
                    IsAvailable = dto.IsAvailable,
                    DisplayOrder = dto.DisplayOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Addons.Add(addon);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Создана добавка: {AddonName} (ID: {AddonId})", addon.Name, addon.Id);

                return Ok(addon);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании добавки");
                return StatusCode(500, new { Message = "Ошибка при создании добавки" });
            }
        }

        // PUT: api/addons/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddon(int id, [FromBody] Addon updatedAddon)
        {
            try
            {
                var addon = await _context.Addons.FindAsync(id);
                if (addon == null)
                    return NotFound(new { Message = $"Добавка с ID {id} не найдена" });

                addon.Name = updatedAddon.Name ?? addon.Name;
                addon.Description = updatedAddon.Description ?? addon.Description;
                addon.Price = updatedAddon.Price;
                addon.DisplayOrder = updatedAddon.DisplayOrder;
                addon.IsAvailable = updatedAddon.IsAvailable;
                addon.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("🔄 Обновлена добавка: {AddonName} (ID: {AddonId})", addon.Name, addon.Id);

                return Ok(addon);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении добавки {AddonId}", id);
                return StatusCode(500, new { Message = "Ошибка при обновлении добавки" });
            }
        }

        // DELETE: api/addons/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddon(int id)
        {
            try
            {
                var addon = await _context.Addons.FindAsync(id);
                if (addon == null)
                    return NotFound(new { Message = $"Добавка с ID {id} не найдена" });

                _context.Addons.Remove(addon);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🗑️ Удалена добавка: {AddonName} (ID: {AddonId})", addon.Name, addon.Id);

                return Ok(new { Message = "Добавка удалена" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении добавки {AddonId}", id);
                return StatusCode(500, new { Message = "Ошибка при удалении добавки" });
            }
        }

        // ==================== SHAWARMA-ADDON LINKS ====================

        // POST: api/addons/link-to-shawarma
        [HttpPost("link-to-shawarma")]
        public async Task<IActionResult> LinkAddonToShawarma([FromBody] LinkAddonRequest request)
        {
            try
            {
                var shawarma = await _context.Shawarmas.FindAsync(request.ShawarmaId);
                if (shawarma == null)
                    return NotFound(new { Message = "Шаурма не найдена" });

                var addon = await _context.Addons.FindAsync(request.AddonId);
                if (addon == null)
                    return NotFound(new { Message = "Добавка не найдена" });

                var existing = await _context.ShawarmaAddons
                    .FirstOrDefaultAsync(sa => sa.ShawarmaId == request.ShawarmaId && sa.AddonId == request.AddonId);

                if (existing != null)
                    return BadRequest(new { Message = "Эта добавка уже привязана к товару" });

                var shawarmaAddon = new ShawarmaAddon
                {
                    ShawarmaId = request.ShawarmaId,
                    AddonId = request.AddonId,
                    CustomPrice = request.CustomPrice,
                    IsDefault = request.IsDefault,
                    MaxQuantity = request.MaxQuantity
                };

                _context.ShawarmaAddons.Add(shawarmaAddon);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🔗 Добавка {AddonName} привязана к товару {ShawarmaName}", 
                    addon.Name, shawarma.Name);

                return Ok(shawarmaAddon);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при привязке добавки к товару");
                return StatusCode(500, new { Message = "Ошибка при привязке добавки" });
            }
        }

        // DELETE: api/addons/unlink-from-shawarma
        [HttpDelete("unlink-from-shawarma")]
        public async Task<IActionResult> UnlinkAddonFromShawarma(int shawarmaId, int addonId)
        {
            try
            {
                var link = await _context.ShawarmaAddons
                    .FirstOrDefaultAsync(sa => sa.ShawarmaId == shawarmaId && sa.AddonId == addonId);

                if (link == null)
                    return NotFound(new { Message = "Связь не найдена" });

                _context.ShawarmaAddons.Remove(link);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🔓 Добавка {AddonId} отвязана от товара {ShawarmaId}", addonId, shawarmaId);

                return Ok(new { Message = "Добавка отвязана от товара" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при отвязке добавки от товара");
                return StatusCode(500, new { Message = "Ошибка при отвязке добавки" });
            }
        }
    }

    public class LinkAddonRequest
    {
        public int ShawarmaId { get; set; }
        public int AddonId { get; set; }
        public decimal? CustomPrice { get; set; }
        public bool IsDefault { get; set; }
        public int MaxQuantity { get; set; } = 1;
    }
}