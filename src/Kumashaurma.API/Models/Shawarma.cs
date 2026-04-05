using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text.Json.Serialization;

namespace Kumashaurma.API.Models
{
    [Table("shawarmas")]
    public class Shawarma
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [Range(0, 10000)]
        [Column("price", TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [MaxLength(500)]
        [Column("description")]
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(50)]
        [Column("category")]
        public string Category { get; set; } = "Курица";
        
        [Column("is_spicy")]
        public bool IsSpicy { get; set; }
        
        [Column("has_cheese")]
        public bool HasCheese { get; set; }
        
        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("is_promo")]
        public bool IsPromo { get; set; } = false;
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Иерархия: parent_id = null → карточка-категория, parent_id = N → дочерняя позиция
        [Column("parent_id")]
        public int? ParentId { get; set; }

        [ForeignKey("ParentId")]
        [JsonIgnore]
        public Shawarma? Parent { get; set; }

        public ICollection<Shawarma> Children { get; set; } = new List<Shawarma>();

        // Вычисляемое: является ли карточкой-категорией
        [NotMapped]
        public bool IsCard => ParentId == null;

        public ICollection<ShawarmaImage> Images { get; set; } = new List<ShawarmaImage>();
    
        [NotMapped]
        public string? PrimaryImage => Images?.FirstOrDefault(i => i.IsPrimary)?.FilePath;

        [Column("sort_order")]
        public int SortOrder { get; set; }
        
        // Связь с добавками
        public ICollection<ShawarmaAddon> Addons { get; set; } = new List<ShawarmaAddon>();

        // Минимальная цена среди дочерних позиций или своя цена
        [NotMapped]
        public decimal DisplayPrice => Children != null && Children.Any()
            ? Children.OrderBy(c => c.Price).First().Price
            : Price;
    }
}