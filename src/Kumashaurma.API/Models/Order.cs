using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("orders")]
    public class Order
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        [Column("customer_name")]
        public string CustomerName { get; set; } = string.Empty;
        
        [MaxLength(20)]
        [Column("phone")]
        public string Phone { get; set; } = string.Empty;
        
        [MaxLength(500)]
        [Column("address")]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        [Column("total", TypeName = "decimal(10,2)")]
        public decimal Total { get; set; }
        
        [MaxLength(50)]
        [Column("status")]
        public string Status { get; set; } = "Новый";
        
        [Column("notes")]
        public string? Notes { get; set; }  // Изменено на nullable
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }
        
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }

    [Table("order_items")]
    public class OrderItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("order_id")]
        public int OrderId { get; set; }
        
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }
        
        [Column("shawarma_id")]
        public int ShawarmaId { get; set; }
        
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Column("quantity")]
        public int Quantity { get; set; } = 1;
        
        [Column("price", TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [Column("subtotal", TypeName = "decimal(10,2)")]
        public decimal Subtotal => Price * Quantity;
    }
}
