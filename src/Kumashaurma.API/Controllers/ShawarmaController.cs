using Microsoft.AspNetCore.Authorization;
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
        private readonly IWebHostEnvironment _environment;

        public ShawarmaController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpPut("reorder")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderItem> items)
        {
            Console.WriteLine($"📥 Получен reorder запрос. Items count: {items?.Count ?? 0}");
            
            if (items == null || !items.Any())
            {
                Console.WriteLine("❌ Нет данных");
                return BadRequest("No items provided");
            }
            
            foreach (var item in items)
            {
                Console.WriteLine($"  - Id: {item.Id}, Order: {item.Order}");
            }
            
            foreach (var item in items)
            {
                var shawarma = await _context.Shawarmas.FindAsync(item.Id);
                if (shawarma != null)
                {
                    shawarma.SortOrder = item.Order;
                }
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        public class ReorderItem
        {
            public int Id { get; set; }
            public int Order { get; set; }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Shawarmas
                .Where(s => !string.IsNullOrEmpty(s.Category))
                .OrderBy(s => s.Category)
                .Select(s => s.Category)
                .Distinct()
                .ToListAsync();
            
            return Ok(categories);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var shawarmas = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.Name)
                .ToListAsync();
                
            return Ok(shawarmas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shawarma == null)
                return NotFound();
                
            return Ok(shawarma);
        }

        [HttpPost]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Create([FromBody] CreateShawarmaRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
                return BadRequest("Name is required");

            var shawarma = new Shawarma
            {
                Name = request.Name,
                Price = request.Price,
                Description = request.Description ?? string.Empty,
                Category = request.Category ?? "Курица",
                IsSpicy = request.IsSpicy,
                HasCheese = request.HasCheese,
                IsAvailable = request.IsAvailable,
                IsPromo = request.IsPromo,
                CreatedAt = DateTime.UtcNow,
            };

            // Добавляем варианты, если есть
            if (request.Variants != null && request.Variants.Any())
            {
                for (int i = 0; i < request.Variants.Count; i++)
                {
                    var v = request.Variants[i];
                    shawarma.Variants.Add(new ProductVariant
                    {
                        Name = v.Name,
                        Price = v.Price,
                        SortOrder = i,
                    });
                }
                // Если есть варианты, цена товара = минимальная из вариантов
                shawarma.Price = shawarma.Variants.OrderBy(v => v.Price).First().Price;
            }

            _context.Shawarmas.Add(shawarma);
            await _context.SaveChangesAsync();
            
            var created = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == shawarma.Id);
                
            return CreatedAtAction(nameof(GetById), new { id = shawarma.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateShawarmaRequest request)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shawarma == null)
                return NotFound();

            shawarma.Name = request.Name ?? shawarma.Name;
            shawarma.Description = request.Description ?? shawarma.Description;
            shawarma.Category = request.Category ?? shawarma.Category;
            shawarma.IsSpicy = request.IsSpicy ?? shawarma.IsSpicy;
            shawarma.HasCheese = request.HasCheese ?? shawarma.HasCheese;
            shawarma.IsAvailable = request.IsAvailable ?? shawarma.IsAvailable;
            shawarma.IsPromo = request.IsPromo ?? shawarma.IsPromo;
            shawarma.UpdatedAt = DateTime.UtcNow;

            // Обновляем варианты
            if (request.Variants != null)
            {
                // Удаляем старые варианты
                _context.ProductVariants.RemoveRange(shawarma.Variants);
                shawarma.Variants.Clear();

                // Добавляем новые
                for (int i = 0; i < request.Variants.Count; i++)
                {
                    var v = request.Variants[i];
                    shawarma.Variants.Add(new ProductVariant
                    {
                        Name = v.Name,
                        Price = v.Price,
                        SortOrder = i,
                    });
                }
            }

            // Обновляем цену = минимальная из вариантов или переданная
            if (shawarma.Variants.Any())
            {
                shawarma.Price = request.Price > 0 ? request.Price : shawarma.Variants.OrderBy(v => v.Price).First().Price;
            }
            else
            {
                shawarma.Price = request.Price;
            }
            
            await _context.SaveChangesAsync();
            
            // Перезагружаем с включёнными связями
            var updated = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == id);
            
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Images)
                .Include(s => s.Variants)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (shawarma == null)
                return NotFound();

            if (shawarma.Images != null && shawarma.Images.Any())
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads");
                foreach (var image in shawarma.Images)
                {
                    var filePath = Path.Combine(uploadsFolder, image.FileName);
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
            }
                
            _context.Shawarmas.Remove(shawarma);
            await _context.SaveChangesAsync();
            
            return Ok(new { Message = $"Shawarma {id} deleted" });
        }

        // DTOs for create/update with variants
        public class VariantDto
        {
            public string Name { get; set; } = string.Empty;
            public decimal Price { get; set; }
        }

        public class CreateShawarmaRequest
        {
            public string Name { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public string? Description { get; set; }
            public string? Category { get; set; }
            public bool? IsSpicy { get; set; }
            public bool? HasCheese { get; set; }
            public bool? IsAvailable { get; set; }
            public bool? IsPromo { get; set; }
            public List<VariantDto>? Variants { get; set; }
        }

        public class UpdateShawarmaRequest
        {
            public string? Name { get; set; }
            public decimal Price { get; set; }
            public string? Description { get; set; }
            public string? Category { get; set; }
            public bool? IsSpicy { get; set; }
            public bool? HasCheese { get; set; }
            public bool? IsAvailable { get; set; }
            public bool? IsPromo { get; set; }
            public List<VariantDto>? Variants { get; set; }
        }
    }
}
