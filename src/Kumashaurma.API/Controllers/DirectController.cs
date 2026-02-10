using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DirectController : ControllerBase
    {
        private readonly string _connectionString = "Host=localhost;Port=5433;Database=kumashaurma_dev;Username=devuser;Password=dev123";

        [HttpGet]
        public IActionResult Get()
        {
            var orders = new List<object>();
            
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            
            using var cmd = new NpgsqlCommand("SELECT id, name, price, created_at, is_completed, description FROM orders", connection);
            using var reader = cmd.ExecuteReader();
            
            while (reader.Read())
            {
                orders.Add(new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    Price = reader.GetDecimal(2),
                    CreatedAt = reader.GetDateTime(3),
                    IsCompleted = reader.GetBoolean(4),
                    Description = reader.IsDBNull(5) ? null : reader.GetString(5)
                });
            }
            
            return Ok(orders);
        }

        [HttpPost]
        public IActionResult Post([FromBody] OrderRequest request)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            
            var sql = @"INSERT INTO orders (name, price, description, created_at, is_completed) 
                       VALUES (@name, @price, @description, @created_at, false)
                       RETURNING id";
            
            using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("name", request.Name);
            cmd.Parameters.AddWithValue("price", request.Price);
            cmd.Parameters.AddWithValue("description", (object?)request.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created_at", DateTime.UtcNow);
            
            var id = cmd.ExecuteScalar();
            
            return Ok(new { Id = id, Message = "Заказ создан" });
        }

        public class OrderRequest
        {
            public string Name { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public string? Description { get; set; }
        }
    }
}
