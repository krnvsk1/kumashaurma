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
        [Authorize(Roles = "admin,manager,courier")]
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

        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "Пользователь не авторизован" });
                }

                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.SelectedAddons)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();
                    
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении заказов пользователя");
                return StatusCode(500, new { Message = "Ошибка сервера при получении заказов" });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
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

                // Валидация количества
                foreach (var itemRequest in request.Items)
                {
                    if (itemRequest.Quantity <= 0)
                        return BadRequest(new { Message = $"Количество товара '{itemRequest.Name}' должно быть больше 0" });

                    if (itemRequest.SelectedAddons != null)
                    {
                        foreach (var selectedAddon in itemRequest.SelectedAddons)
                        {
                            if (selectedAddon.Quantity <= 0)
                                return BadRequest(new { Message = "Количество добавки должно быть больше 0" });
                        }
                    }
                }

                // Получаем актуальные цены из базы данных (только доступные шаурмы)
                var shawarmaIds = request.Items.Select(i => i.ShawarmaId).Distinct();
                var shawarmas = await _context.Shawarmas
                    .Where(s => s.IsAvailable && shawarmaIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Price);

                // Проверяем, что все запрошенные шаурмы существуют и доступны
                var missingShawarmaIds = shawarmaIds.Where(id => !shawarmas.ContainsKey(id)).ToList();
                if (missingShawarmaIds.Any())
                    return BadRequest(new { Message = $"Шаурма с ID {string.Join(", ", missingShawarmaIds)} не найдена или недоступна" });

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

                // Получаем UserId если пользователь авторизован
                int? userId = null;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
                {
                    userId = parsedUserId;
                }

                // Валидация промокода
                decimal discountAmount = 0;
                PromoCode? promoCode = null;
                if (request.PromoCodeId.HasValue)
                {
                    promoCode = await _context.PromoCodes.FindAsync(request.PromoCodeId.Value);
                    if (promoCode == null || !promoCode.IsActive)
                        return BadRequest(new { Message = "Промокод не найден или неактивен" });
                }

                // Создаем заказ
                var newOrder = new Order
                {
                    UserId = userId,
                    CustomerName = request.CustomerName.Trim(),
                    Phone = request.Phone?.Trim() ?? string.Empty,
                    Address = request.Address?.Trim() ?? string.Empty,
                    Total = 0,
                    Status = "Новый",
                    Notes = request.Notes,
                    DeliveryType = !string.IsNullOrEmpty(request.DeliveryType) ? request.DeliveryType : "Доставка",
                    PromoCodeId = request.PromoCodeId,
                    DiscountAmount = 0,
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

                // Применяем промокод
                if (promoCode != null)
                {
                    discountAmount = promoCode.CalculateDiscount(total);
                    if (discountAmount > 0)
                    {
                        promoCode.CurrentUses++;
                        _context.PromoCodes.Update(promoCode);
                    }
                }

                newOrder.DiscountAmount = discountAmount;
                // Обновляем общую сумму заказа (с учётом скидки)
                newOrder.Total = total - discountAmount;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Заказ создан с ID: {OrderId}, клиент: {CustomerName}", 
                    newOrder.Id, newOrder.CustomerName);

                // Загружаем полный заказ с позициями для ответа
                var createdOrder = await _context.Orders
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.SelectedAddons)
                    .FirstOrDefaultAsync(o => o.Id == newOrder.Id);

                // Рассчитываем баллы, которые будут начислены за заказ (1 балл за 100 рублей)
                var pointsEarned = (int)(Math.Floor((total - discountAmount) / 100));

                return CreatedAtAction(nameof(GetById), new { id = newOrder.Id }, new
                {
                    Order = createdOrder,
                    PointsEarned = pointsEarned
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

        // Обновленный DTO для запроса
        public class CreateOrderRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Address { get; set; } = string.Empty;
            public string? Notes { get; set; }
            public string DeliveryType { get; set; } = "Доставка";
            public int? PromoCodeId { get; set; }
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
        [Authorize(Roles = "admin,manager,courier")]
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
                    var oldStatus = order.Status;
                    order.Status = request.Status;
                    
                    if (request.Status == "Выполнен" && order.CompletedAt == null)
                    {
                        order.CompletedAt = DateTime.UtcNow;
                    }
                    else if (oldStatus == "Выполнен" && request.Status != "Выполнен")
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
        [Authorize(Roles = "admin,manager")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });

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
        [Authorize(Roles = "admin,manager")]
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
        [Authorize(Roles = "admin,manager,courier")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderRequest request)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { Message = $"Заказ с ID {id} не найден" });

                if (!string.IsNullOrEmpty(request.Status))
                {
                    var oldStatus = order.Status;
                    order.Status = request.Status;
                    
                    if (request.Status == "Выполнен" && order.CompletedAt == null)
                    {
                        order.CompletedAt = DateTime.UtcNow;

                        // Начисляем бонусные баллы при выполнении заказа (1 балл за 100 рублей)
                        if (order.UserId.HasValue)
                        {
                            var user = await _context.Users.FindAsync(order.UserId.Value);
                            if (user != null)
                            {
                                // Проверяем, не начислялись ли уже баллы за этот заказ
                                var alreadyAwarded = await _context.UserPointsTransactions
                                    .AnyAsync(t => t.OrderId == order.Id && t.Type == "earned");

                                if (!alreadyAwarded)
                                {
                                    var pointsEarned = (int)Math.Floor(order.Total / 100);
                                    if (pointsEarned > 0)
                                    {
                                        user.PointsBalance += pointsEarned;

                                        var transaction = new UserPointsTransaction
                                        {
                                            UserId = user.Id,
                                            Type = "earned",
                                            Amount = pointsEarned,
                                            Description = $"Начисление за заказ #{order.Id}",
                                            OrderId = order.Id,
                                            CreatedAt = DateTime.UtcNow
                                        };

                                        _context.UserPointsTransactions.Add(transaction);
                                        _logger.LogInformation("💰 Начислено {Points} баллов пользователю {UserId} за заказ {OrderId}",
                                            pointsEarned, user.Id, order.Id);
                                    }
                                }
                            }
                        }
                    }
                    else if (oldStatus == "Выполнен" && request.Status != "Выполнен")
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

    public class UpdateOrderRequest
    {
        public string? Status { get; set; }
        public decimal Total { get; set; }
    }
}