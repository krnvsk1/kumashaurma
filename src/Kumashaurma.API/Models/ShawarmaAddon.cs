using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("shawarma_addons")]
    public class ShawarmaAddon
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("shawarma_id")]
        public int ShawarmaId { get; set; }
        
        [ForeignKey("ShawarmaId")]
        public Shawarma Shawarma { get; set; } = null!;
        
        [Column("addon_id")]
        public int AddonId { get; set; }
        
        [ForeignKey("AddonId")]
        public Addon Addon { get; set; } = null!;
        
        [Column("custom_price", TypeName = "decimal(10,2)")]
        public decimal? CustomPrice { get; set; } // Специальная цена для этого товара
        
        [Column("is_default")]
        public bool IsDefault { get; set; } // Добавка по умолчанию
        
        [Column("max_quantity")]
        public int MaxQuantity { get; set; } = 1; // Максимальное количество для этой добавки
    }
}