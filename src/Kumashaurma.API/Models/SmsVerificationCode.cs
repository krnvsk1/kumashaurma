using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("sms_verification_codes")]
    public class SmsVerificationCode
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("phone")]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MaxLength(4)]
        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("verified_at")]
        public DateTime? VerifiedAt { get; set; }

        [Column("attempts")]
        public int Attempts { get; set; } = 0;

        [Column("blocked_until")]
        public DateTime? BlockedUntil { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsExpired => DateTime.UtcNow > ExpiresAt;
        public bool IsBlocked => BlockedUntil.HasValue && DateTime.UtcNow < BlockedUntil.Value;
        public bool IsVerified => VerifiedAt.HasValue;
    }
}
