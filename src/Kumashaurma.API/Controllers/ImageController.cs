using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ImageController> _logger;

        public ImageController(
            ApplicationDbContext context, 
            IWebHostEnvironment environment,
            ILogger<ImageController> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost("upload/{shawarmaId}")]
        public async Task<IActionResult> UploadImage(int shawarmaId, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { Message = "Файл не выбран" });

                // Проверяем, существует ли шаурма
                var shawarma = await _context.Shawarmas.FindAsync(shawarmaId);
                if (shawarma == null)
                    return NotFound(new { Message = "Шаурма не найдена" });

                // Создаём папку для изображений, если её нет
                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Генерируем уникальное имя файла
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Сохраняем файл
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Сохраняем информацию в БД
                var image = new ShawarmaImage
                {
                    ShawarmaId = shawarmaId,
                    FileName = fileName,
                    FilePath = $"/uploads/{fileName}",
                    IsPrimary = !await _context.ShawarmaImages.AnyAsync(i => i.ShawarmaId == shawarmaId),
                    CreatedAt = DateTime.UtcNow
                };

                await _context.ShawarmaImages.AddAsync(image);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    Message = "Изображение загружено", 
                    ImagePath = image.FilePath,
                    IsPrimary = image.IsPrimary 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при загрузке изображения");
                return StatusCode(500, new { Message = "Ошибка при загрузке изображения" });
            }
        }

        [HttpGet("shawarma/{shawarmaId}")]
        public async Task<IActionResult> GetImages(int shawarmaId)
        {
            try
            {
                var images = await _context.ShawarmaImages
                    .Where(i => i.ShawarmaId == shawarmaId)
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenByDescending(i => i.CreatedAt)
                    .Select(i => new
                    {
                        i.Id,
                        i.FilePath,
                        i.IsPrimary,
                        i.CreatedAt
                    })
                    .ToListAsync();

                return Ok(images);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении изображений");
                return StatusCode(500, new { Message = "Ошибка при получении изображений" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            try
            {
                var image = await _context.ShawarmaImages.FindAsync(id);
                if (image == null)
                    return NotFound(new { Message = "Изображение не найдено" });

                // Удаляем файл
                var filePath = Path.Combine(_environment.WebRootPath ?? "wwwroot", image.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);

                // Удаляем запись из БД
                _context.ShawarmaImages.Remove(image);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Изображение удалено" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении изображения");
                return StatusCode(500, new { Message = "Ошибка при удалении изображения" });
            }
        }
    }
}