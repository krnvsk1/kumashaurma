using Microsoft.AspNetCore.Mvc;
using System;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private static List<Order> _orders = new()
        {
            new Order 
            { 
                Id = 1, 
                CustomerName = "Иван Иванов", 
                Phone = "+7 999 123-45-67",
                Address = "ул. Ленина, д. 10, кв. 5",
                Total = 350, 
                Status = "Выполнен", 
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Items = new List<OrderItem>
                {
                    new OrderItem { ShawarmaId = 1, Name = "Классическая шаурма", Quantity = 1, Price = 250 },
                    new OrderItem { ShawarmaId = 10, Name = "Кола", Quantity = 1, Price = 100 }
                }
            },
            new Order 
            { 
                Id = 2, 
                CustomerName = "Мария Петрова", 
                Phone = "+7 999 234-56-78",
                Address = "пр. Мира, д. 25",
                Total = 450, 
                Status = "В процессе", 
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                Items = new List<OrderItem>
                {
                    new OrderItem { ShawarmaId = 2, Name = "Острая шаурма", Quantity = 1, Price = 280 },
                    new OrderItem { ShawarmaId = 3, Name = "Шаурма с сыром", Quantity = 1, Price = 320 }
                }
            },
            new Order 
            { 
                Id = 3, 
                CustomerName = "Алексей Сидоров", 
                Phone = "+7 999 345-67-89",
                Address = "ул. Советская, д. 15, кв. 12",
                Total = 520, 
                Status = "Доставляется", 
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                Items = new List<OrderItem>
                {
                    new OrderItem { ShawarmaId = 1, Name = "Классическая шаурма", Quantity = 2, Price = 250 }
                }
            },
            new Order 
            { 
                Id = 4, 
                CustomerName = "Елена Ковалёва", 
                Phone = "+7 999 456-78-90",
                Address = "ул. Центральная, д. 8",
                Total = 280, 
                Status = "Новый", 
                CreatedAt = DateTime.UtcNow.AddMinutes(-15),
                Items = new List<OrderItem>
                {
                    new OrderItem { ShawarmaId = 5, Name = "Детская шаурма", Quantity = 1, Price = 180 },
                    new OrderItem { ShawarmaId = 11, Name = "Сок", Quantity = 1, Price = 100 }
                }
            }
        };

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_orders);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var order = _orders.FirstOrDefault(o => o.Id == id);
            if (order == null)
                return NotFound();
                
            return Ok(order);
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateOrderRequest request)
        {
            if (string.IsNullOrEmpty(request.CustomerName))
                return BadRequest("CustomerName is required");
                
            var newOrder = new Order
            {
                Id = _orders.Count + 1,
                CustomerName = request.CustomerName,
                Phone = request.Phone,
                Address = request.Address,
                Total = request.Items.Sum(i => i.Price * i.Quantity),
                Status = "Новый",
                CreatedAt = DateTime.UtcNow,
                Items = request.Items
            };
            
            _orders.Add(newOrder);
            return CreatedAtAction(nameof(GetById), new { id = newOrder.Id }, newOrder);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] UpdateOrderRequest request)
        {
            var order = _orders.FirstOrDefault(o => o.Id == id);
            if (order == null)
                return NotFound();
                
            order.Status = request.Status ?? order.Status;
            order.Total = request.Total;
            
            return Ok(order);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var order = _orders.FirstOrDefault(o => o.Id == id);
            if (order == null)
                return NotFound();
                
            _orders.Remove(order);
            return Ok(new { Message = $"Order {id} deleted" });
        }
    }

    public class Order
    {
        public int Id { get; set; }
        public string CustomerName { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItem> Items { get; set; } = new();
    }

    public class OrderItem
    {
        public int ShawarmaId { get; set; }
        public string Name { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class CreateOrderRequest
    {
        public string CustomerName { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public List<OrderItem> Items { get; set; } = new();
    }

    public class UpdateOrderRequest
    {
        public string Status { get; set; }
        public decimal Total { get; set; }
    }
}
