using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("shawarma_images")]
    public class ShawarmaImage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }
        
        [Column("shawarma_id")]
        public int ShawarmaId { get; set; }
        
        [ForeignKey("ShawarmaId")]
        public Shawarma? Shawarma { get; set; }
        
        [Required]
        [Column("file_name")]
        public string FileName { get; set; } = string.Empty;
        
        [Column("file_path")]
        public string FilePath { get; set; } = string.Empty;
        
        [Column("is_primary")]
        public bool IsPrimary { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}