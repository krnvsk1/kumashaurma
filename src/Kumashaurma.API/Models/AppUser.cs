using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Kumashaurma.API.Models
{
    [Table("users")]
    public class AppUser : IdentityUser<int>
    {
        [PersonalData]
        [MaxLength(100)]
        [Column("first_name")]
        public string? FirstName { get; set; }

        [PersonalData]
        [MaxLength(100)]
        [Column("last_name")]
        public string? LastName { get; set; }

        [Column("phone_verified")]
        public bool PhoneVerified { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("points_balance")]
        public int PointsBalance { get; set; } = 0;

        // Navigation properties
        public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
