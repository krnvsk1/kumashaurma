using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("order_item_addons")]
    public class OrderItemAddon
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("order_item_id")]
        public int OrderItemId { get; set; }
        
        [ForeignKey("OrderItemId")]
        public OrderItem OrderItem { get; set; } = null!;
        
        [Column("addon_id")]
        public int AddonId { get; set; }
        
        [Column("addon_name")]
        [MaxLength(100)]
        public string AddonName { get; set; } = string.Empty; // Название на момент заказа
        
        [Column("addon_category_id")]
        public int AddonCategoryId { get; set; }
        
        [Column("addon_category_name")]
        [MaxLength(100)]
        public string AddonCategoryName { get; set; } = string.Empty; // Категория на момент заказа
        
        [Column("price", TypeName = "decimal(10,2)")]
        public decimal Price { get; set; } // Цена на момент заказа
        
        [Column("quantity")]
        public int Quantity { get; set; } = 1;
    }
}