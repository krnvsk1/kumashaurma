using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("user_points_transactions")]
    public class UserPointsTransaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        // Тип: "earned" (начисление), "spent" (списание), "admin_grant" (от админа), "admin_deduct" (списание админом), "expired" (сгорание)
        [Required]
        [MaxLength(30)]
        [Column("type")]
        public string Type { get; set; } = "earned";

        // Количество баллов (положительное — начисление, отрицательное — списание)
        [Column("amount")]
        public int Amount { get; set; }

        // Описание/причина
        [MaxLength(200)]
        [Column("description")]
        public string? Description { get; set; }

        // Связанный заказ (если баллы начислены/потрачены за заказ)
        [Column("order_id")]
        public int? OrderId { get; set; }

        // ID администратора, если операция от админа
        [Column("performed_by")]
        public int? PerformedBy { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public AppUser? User { get; set; }
        public Order? Order { get; set; }
        public AppUser? PerformedByUser { get; set; }
    }
}
