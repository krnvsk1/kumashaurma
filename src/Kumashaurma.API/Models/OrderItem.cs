using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Kumashaurma.API.Models
{
    [Table("order_items")]
    public class OrderItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("order_id")]
        [JsonIgnore]
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
        
        // 👇 ДОБАВЛЯЕМ: связь с выбранными добавками
        public ICollection<OrderItemAddon> SelectedAddons { get; set; } = new List<OrderItemAddon>();
    }
}