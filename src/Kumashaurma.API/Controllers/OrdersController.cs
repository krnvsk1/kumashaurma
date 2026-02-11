using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(ApplicationDbContext context, ILogger<OrdersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orders = await _context.Orders
                    .Include(o => o.OrderItems) // Загружаем связанные позиции
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();
                    
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении заказов");
                return StatusCode(500, new { Message = "Ошибка сервера при получении заказов" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);
                    
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });
                    
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении заказа ID {OrderId}", id);
                return StatusCode(500, new { Message = "Ошибка сервера при получении заказа" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
        {
            try
            {
                // Валидация
                if (string.IsNullOrEmpty(request.CustomerName))
                    return BadRequest(new { Message = "Имя клиента обязательно" });
                    
                if (request.Items == null || !request.Items.Any())
                    return BadRequest(new { Message = "Добавьте хотя бы один товар в заказ" });

                // Рассчитываем сумму заказа
                var total = request.Items.Sum(i => i.Price * i.Quantity);

                // Создаем заказ (БД сама сгенерирует ID)
                var newOrder = new Order
                {
                    CustomerName = request.CustomerName.Trim(),
                    Phone = request.Phone?.Trim(),
                    Address = request.Address?.Trim(),
                    Total = total,
                    Status = "Новый",
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = null
                };

                // Сохраняем заказ, чтобы получить ID
                await _context.Orders.AddAsync(newOrder);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Заказ создан с ID: {OrderId}, клиент: {CustomerName}", 
                    newOrder.Id, newOrder.CustomerName);

                // Добавляем позиции заказа
                foreach (var itemRequest in request.Items)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = newOrder.Id, // Используем ID из БД
                        ShawarmaId = itemRequest.ShawarmaId,
                        Name = itemRequest.Name,
                        Quantity = itemRequest.Quantity,
                        Price = itemRequest.Price
                    };
                    await _context.OrderItems.AddAsync(orderItem);
                }

                await _context.SaveChangesAsync();

                // Возвращаем созданный заказ
                    return CreatedAtAction(nameof(GetById), new { id = newOrder.Id }, new 
                    {
                        Id = newOrder.Id,
                        CustomerName = newOrder.CustomerName,
                        Phone = newOrder.Phone,
                        Address = newOrder.Address,
                        Total = newOrder.Total,
                        Status = newOrder.Status,
                        CreatedAt = newOrder.CreatedAt
                    });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Ошибка базы данных при создании заказа");
                return StatusCode(500, new { Message = "Ошибка при сохранении заказа в базу данных" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании заказа");
                return StatusCode(500, new { Message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateOrderRequest request)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });

                // Обновляем поля
                if (!string.IsNullOrEmpty(request.Status))
                {
                    order.Status = request.Status;
                    
                    // Если статус "Выполнен", ставим дату выполнения
                    if (request.Status == "Выполнен" && order.CompletedAt == null)
                    {
                        order.CompletedAt = DateTime.UtcNow;
                    }
                    // Если статус изменился с "Выполнен", очищаем дату
                    else if (order.Status == "Выполнен" && request.Status != "Выполнен")
                    {
                        order.CompletedAt = null;
                    }
                }
                
                if (request.Total > 0)
                    order.Total = request.Total;

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("🔄 Заказ обновлен: ID {OrderId}, новый статус: {Status}", 
                    id, order.Status);
                    
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении заказа ID {OrderId}", id);
                return StatusCode(500, new { Message = "Ошибка сервера при обновлении заказа" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });

                // Удаляем связанные позиции заказа
                var orderItems = await _context.OrderItems
                    .Where(oi => oi.OrderId == id)
                    .ToListAsync();
                    
                _context.OrderItems.RemoveRange(orderItems);
                _context.Orders.Remove(order);
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("🗑️ Заказ удален: ID {OrderId}, клиент: {CustomerName}", 
                    id, order.CustomerName);
                    
                return Ok(new { Message = $"Заказ {id} успешно удален", DeletedId = id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении заказа ID {OrderId}", id);
                return StatusCode(500, new { Message = "Ошибка сервера при удалении заказа" });
            }
        }

        // Дополнительный метод для получения статистики
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalOrders = await _context.Orders.CountAsync();
                var totalRevenue = await _context.Orders.SumAsync(o => o.Total);
                var todayOrders = await _context.Orders
                    .Where(o => o.CreatedAt.Date == DateTime.UtcNow.Date)
                    .CountAsync();
                    
                return Ok(new
                {
                    TotalOrders = totalOrders,
                    TotalRevenue = totalRevenue,
                    TodayOrders = todayOrders,
                    AverageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении статистики");
                return StatusCode(500, new { Message = "Ошибка сервера при получении статистики" });
            }
        }
    }

    public class CreateOrderRequest
    {
        public string? CustomerName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public int ShawarmaId { get; set; }
        public string? Name { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class UpdateOrderRequest
    {
        public string? Status { get; set; }
        public decimal Total { get; set; }
    }
}