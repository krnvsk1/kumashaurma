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
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.SelectedAddons)
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
                        .ThenInclude(oi => oi.SelectedAddons)
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
                if (string.IsNullOrWhiteSpace(request.CustomerName))
                    return BadRequest(new { Message = "Имя клиента обязательно" });
                    
                if (request.Items == null || !request.Items.Any())
                    return BadRequest(new { Message = "Добавьте хотя бы один товар в заказ" });

                // Получаем актуальные цены из базы данных
                var shawarmaIds = request.Items.Select(i => i.ShawarmaId).Distinct();
                var shawarmas = await _context.Shawarmas
                    .Where(s => shawarmaIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Price);

                // Получаем все добавки для проверки цен
                var allAddonIds = request.Items
                    .Where(i => i.SelectedAddons != null)
                    .SelectMany(i => i.SelectedAddons!)
                    .Select(a => a.AddonId)
                    .Distinct()
                    .ToList();

                var addons = new Dictionary<int, Addon>();
                if (allAddonIds.Any())
                {
                    addons = await _context.Addons
                        .Include(a => a.Category)
                        .Where(a => allAddonIds.Contains(a.Id))
                        .ToDictionaryAsync(a => a.Id, a => a);
                }

                // Создаем заказ
                var newOrder = new Order
                {
                    CustomerName = request.CustomerName.Trim(),
                    Phone = request.Phone?.Trim() ?? string.Empty,
                    Address = request.Address?.Trim() ?? string.Empty,
                    Total = 0,
                    Status = "Новый",
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = null
                };

                await _context.Orders.AddAsync(newOrder);
                await _context.SaveChangesAsync();

                decimal total = 0;
                
                // Добавляем позиции заказа
                foreach (var itemRequest in request.Items)
                {
                    var basePrice = shawarmas.GetValueOrDefault(itemRequest.ShawarmaId, 0);
                    
                    var orderItem = new OrderItem
                    {
                        OrderId = newOrder.Id,
                        ShawarmaId = itemRequest.ShawarmaId,
                        Name = itemRequest.Name?.Trim() ?? "Без названия",
                        Quantity = itemRequest.Quantity,
                        Price = basePrice
                    };
                    
                    await _context.OrderItems.AddAsync(orderItem);
                    await _context.SaveChangesAsync(); // Сохраняем, чтобы получить Id

                    decimal addonsTotal = 0;
                    
                    // Добавляем выбранные добавки
                    if (itemRequest.SelectedAddons != null && itemRequest.SelectedAddons.Any())
                    {
                        foreach (var selectedAddon in itemRequest.SelectedAddons)
                        {
                            if (addons.TryGetValue(selectedAddon.AddonId, out var addon))
                            {
                                var addonPrice = addon.Price * selectedAddon.Quantity;
                                
                                var orderItemAddon = new OrderItemAddon
                                {
                                    OrderItemId = orderItem.Id,
                                    AddonId = addon.Id,
                                    AddonName = addon.Name,
                                    AddonCategoryId = addon.AddonCategoryId,
                                    AddonCategoryName = addon.Category?.Name ?? "Добавки",
                                    Price = addon.Price,
                                    Quantity = selectedAddon.Quantity
                                };
                                
                                await _context.OrderItemAddons.AddAsync(orderItemAddon);
                                addonsTotal += addonPrice;
                            }
                        }
                    }
                    
                    await _context.SaveChangesAsync(); // Сохраняем добавки
                    
                    total += (basePrice + addonsTotal) * itemRequest.Quantity;
                }

                // Обновляем общую сумму заказа
                newOrder.Total = total;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Заказ создан с ID: {OrderId}, клиент: {CustomerName}", 
                    newOrder.Id, newOrder.CustomerName);

                // Загружаем полный заказ с позициями для ответа
                var createdOrder = await _context.Orders
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.SelectedAddons)
                    .FirstOrDefaultAsync(o => o.Id == newOrder.Id);

                return CreatedAtAction(nameof(GetById), new { id = newOrder.Id }, createdOrder);
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

        // Обновленный DTO для запроса
        public class CreateOrderRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Address { get; set; } = string.Empty;
            public string? Notes { get; set; }
            public List<CreateOrderItemRequest> Items { get; set; } = new();
        }

        public class CreateOrderItemRequest
        {
            public int ShawarmaId { get; set; }
            public string Name { get; set; } = string.Empty;
            public int Quantity { get; set; }
            public List<SelectedAddonDto>? SelectedAddons { get; set; }
        }

        public class SelectedAddonDto
        {
            public int AddonId { get; set; }
            public int Quantity { get; set; } = 1;
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
                    
                    if (request.Status == "Выполнен" && order.CompletedAt == null)
                    {
                        order.CompletedAt = DateTime.UtcNow;
                    }
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

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalOrders = await _context.Orders.CountAsync();
                var totalRevenue = await _context.Orders.SumAsync(o => o.Total);
                var today = DateTime.UtcNow.Date;
                var todayOrders = await _context.Orders
                    .Where(o => o.CreatedAt.Date == today)
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

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderRequest request)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });

                if (!string.IsNullOrEmpty(request.Status))
                {
                    order.Status = request.Status;
                    
                    if (request.Status == "Выполнен" && order.CompletedAt == null)
                    {
                        order.CompletedAt = DateTime.UtcNow;
                    }
                    else if (order.Status == "Выполнен" && request.Status != "Выполнен")
                    {
                        order.CompletedAt = null;
                    }
                }

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("🔄 Статус заказа обновлен: ID {OrderId}, новый статус: {Status}", 
                    id, order.Status);
                    
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении статуса заказа ID {OrderId}", id);
                return StatusCode(500, new { Message = "Ошибка сервера при обновлении статуса" });
            }
        }
    }

    public class CreateOrderRequest
    {
        public string CustomerName { get; set; } = string.Empty;  // 👈 Исправлено
        public string Phone { get; set; } = string.Empty;  // 👈 Исправлено
        public string Address { get; set; } = string.Empty;  // 👈 Исправлено
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public int ShawarmaId { get; set; }
        public string Name { get; set; } = string.Empty;  // 👈 Исправлено
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class UpdateOrderRequest
    {
        public string? Status { get; set; }
        public decimal Total { get; set; }
    }
}