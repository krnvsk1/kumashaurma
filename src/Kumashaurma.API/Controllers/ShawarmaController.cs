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

        [HttpPut("reorder")]
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var shawarmas = await _context.Shawarmas
                .Include(s => s.Images)  // 👈 ЗАГРУЖАЕМ ИЗОБРАЖЕНИЯ
                .OrderBy(s => s.SortOrder)
                .OrderBy(s => s.Name)
                .ToListAsync();
                
            return Ok(shawarmas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Images)  // 👈 И ЗДЕСЬ ТОЖЕ
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shawarma == null)
                return NotFound();
                
            return Ok(shawarma);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Shawarma shawarma)
        {
            if (string.IsNullOrEmpty(shawarma.Name))
                return BadRequest("Name is required");
                
            shawarma.CreatedAt = DateTime.UtcNow;
            _context.Shawarmas.Add(shawarma);
            await _context.SaveChangesAsync();
            
            // Загружаем созданный товар с изображениями (их пока нет)
            var created = await _context.Shawarmas
                .Include(s => s.Images)
                .FirstOrDefaultAsync(s => s.Id == shawarma.Id);
                
            return CreatedAtAction(nameof(GetById), new { id = shawarma.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Shawarma updatedShawarma)
        {
            var shawarma = await _context.Shawarmas
                .Include(s => s.Images)  // 👈 ЗАГРУЖАЕМ ДЛЯ ОТВЕТА
                .FirstOrDefaultAsync(s => s.Id == id);
                
            if (shawarma == null)
                return NotFound();
                
            shawarma.Name = updatedShawarma.Name ?? shawarma.Name;
            shawarma.Price = updatedShawarma.Price;
            shawarma.Description = updatedShawarma.Description ?? shawarma.Description;
            shawarma.Category = updatedShawarma.Category ?? shawarma.Category;
            shawarma.IsSpicy = updatedShawarma.IsSpicy;
            shawarma.HasCheese = updatedShawarma.HasCheese;
            shawarma.IsAvailable = updatedShawarma.IsAvailable;
            shawarma.IsPromo = updatedShawarma.IsPromo;
            shawarma.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return Ok(shawarma);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var shawarma = await _context.Shawarmas.FindAsync(id);
            if (shawarma == null)
                return NotFound();
                
            _context.Shawarmas.Remove(shawarma);
            await _context.SaveChangesAsync();
            
            return Ok(new { Message = $"Shawarma {id} deleted" });
        }
    }
}