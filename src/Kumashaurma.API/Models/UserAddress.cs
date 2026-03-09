using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("user_addresses")]
    public class UserAddress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [MaxLength(10)]
        [Column("entrance")]
        public string? Entrance { get; set; }

        [MaxLength(10)]
        [Column("floor")]
        public string? Floor { get; set; }

        [MaxLength(10)]
        [Column("apartment")]
        public string? Apartment { get; set; }

        [MaxLength(200)]
        [Column("comment")]
        public string? Comment { get; set; }

        [Column("is_default")]
        public bool IsDefault { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public AppUser User { get; set; } = null!;
    }
}
