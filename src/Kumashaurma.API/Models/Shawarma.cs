using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
