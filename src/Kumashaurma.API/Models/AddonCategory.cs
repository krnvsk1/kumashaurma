using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("addon_categories")]
    public class AddonCategory
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
        
        [Column("display_order")]
        public int DisplayOrder { get; set; }
        
        [Column("is_required")]
        public bool IsRequired { get; set; }
        
        [Column("min_selections")]
        public int MinSelections { get; set; } = 0;
        
        [Column("max_selections")]
        public int MaxSelections { get; set; } = 0; // 0 = без ограничений
        
        [Column("is_active")]
        public bool IsActive { get; set; } = true;
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        
        // Навигационное свойство
        public ICollection<Addon> Addons { get; set; } = new List<Addon>();
    }
}