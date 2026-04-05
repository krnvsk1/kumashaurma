using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShawarmaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ShawarmaController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/shawarma
        // Возвращает все позиции с дочерними (для клиентского меню)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Shawarma>>> GetAll()
        {
            var shawarmas = await _context.Shawarmas
                .Include(s => s.Children)
                    .ThenInclude(c => c.Images)
                .Include(s => s.Children)
                    .ThenInclude(c => c.Addons)
                        .ThenInclude(a => a.Addon)
                            .ThenInclude(a => a.Category)
                .Include(s => s.Images)
                .Include(s => s.Addons)
                    .ThenInclude(a => a.Addon)
                        .ThenInclude(a => a.Category)
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

            return Ok(shawarmas);
        }

        // GET: api/shawarma/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Shawarma>> GetById(int id)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Children)
                    .ThenInclude(c => c.Images)
                .Include(s => s.Children)
                    .ThenInclude(c => c.Addons)
                        .ThenInclude(a => a.Addon)
                            .ThenInclude(a => a.Category)
                .Include(s => s.Images)
                .Include(s => s.Addons)
                    .ThenInclude(a => a.Addon)
                        .ThenInclude(a => a.Category)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shawarma == null)
                return NotFound(new { Message = $"Шаурма с ID {id} не найдена" });

            return Ok(shawarma);
        }

        // GET: api/shawarma/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Shawarmas
                .Where(s => s.ParentId == null)
                .Select(s => s.Name)
                .OrderBy(n => n)
                .ToListAsync();

            return Ok(categories);
        }

        // POST: api/shawarma
        [HttpPost]
        public async Task<ActionResult<Shawarma>> Create([FromBody] CreateShawarmaDto dto)
        {
            if (await _context.Shawarmas.AnyAsync(s => s.Name == dto.Name))
                return BadRequest(new { Message = "Шаурма с таким названием уже существует" });

            var shawarma = new Shawarma
            {
                Name = dto.Name,
                Price = dto.Price,
                Description = dto.Description ?? string.Empty,
                IsSpicy = dto.IsSpicy,
                HasCheese = dto.HasCheese,
                IsAvailable = dto.IsAvailable,
                IsPromo = dto.IsPromo,
                ParentId = dto.ParentId,
                SortOrder = dto.SortOrder
            };

            _context.Shawarmas.Add(shawarma);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = shawarma.Id }, shawarma);
        }

        // PUT: api/shawarma/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateShawarmaDto dto)
        {
            var shawarma = await _context.Shawarmas.FindAsync(id);
            if (shawarma == null)
                return NotFound(new { Message = $"Шаурма с ID {id} не найдена" });

            if (dto.Name != null && dto.Name != shawarma.Name &&
                await _context.Shawarmas.AnyAsync(s => s.Name == dto.Name))
                return BadRequest(new { Message = "Шаурма с таким названием уже существует" });

            if (dto.Name != null) shawarma.Name = dto.Name;
            if (dto.Price.HasValue) shawarma.Price = dto.Price.Value;
            if (dto.Description != null) shawarma.Description = dto.Description;
            if (dto.IsSpicy.HasValue) shawarma.IsSpicy = dto.IsSpicy.Value;
            if (dto.HasCheese.HasValue) shawarma.HasCheese = dto.HasCheese.Value;
            if (dto.IsAvailable.HasValue) shawarma.IsAvailable = dto.IsAvailable.Value;
            if (dto.IsPromo.HasValue) shawarma.IsPromo = dto.IsPromo.Value;
            if (dto.ParentId.HasValue) shawarma.ParentId = dto.ParentId;
            if (dto.SortOrder.HasValue) shawarma.SortOrder = dto.SortOrder.Value;

            shawarma.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(shawarma);
        }

        // DELETE: api/shawarma/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Children)
                .Include(s => s.Images)
                .Include(s => s.Addons)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shawarma == null)
                return NotFound(new { Message = $"Шаурма с ID {id} не найдена" });

            _context.Shawarmas.Remove(shawarma);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Шаурма успешно удалена" });
        }

        // PUT: api/shawarma/reorder
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderItem> items)
        {
            foreach (var item in items)
            {
                var shawarma = await _context.Shawarmas.FindAsync(item.Id);
                if (shawarma != null)
                    shawarma.SortOrder = item.SortOrder;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Порядок обновлён" });
        }
    }

    public class CreateShawarmaDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public bool IsSpicy { get; set; }
        public bool HasCheese { get; set; }
        public bool IsAvailable { get; set; } = true;
        public bool IsPromo { get; set; }
        public int? ParentId { get; set; }
        public int SortOrder { get; set; }
    }

    public class UpdateShawarmaDto
    {
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public string? Description { get; set; }
        public bool? IsSpicy { get; set; }
        public bool? HasCheese { get; set; }
        public bool? IsAvailable { get; set; }
        public bool? IsPromo { get; set; }
        public int? ParentId { get; set; }
        public int? SortOrder { get; set; }
    }

    public class ReorderItem
    {
        public int Id { get; set; }
        public int SortOrder { get; set; }
    }
}