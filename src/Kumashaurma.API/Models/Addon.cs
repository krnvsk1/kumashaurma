using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("addons")]
    public class Addon
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        [Column("description")]
        public string? Description { get; set; }
        
        [Required]
        [Range(0, 10000)]
        [Column("price", TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [Column("display_order")]
        public int DisplayOrder { get; set; }
        
        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;
        
        [Column("addon_category_id")]
        public int AddonCategoryId { get; set; }
        
        [ForeignKey("AddonCategoryId")]
        public AddonCategory Category { get; set; } = null!;
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        
        // Связь многие-ко-многим с Shawarma
        public ICollection<ShawarmaAddon> Shawarmas { get; set; } = new List<ShawarmaAddon>();
    }
}