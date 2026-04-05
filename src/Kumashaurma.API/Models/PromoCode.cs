using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Kumashaurma.API.Models
{
    [Table("promo_codes")]
    public class PromoCode
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("code")]
        public string Code { get; set; } = string.Empty;

        // Тип скидки: "percent" — процент, "fixed" — фиксированная сумма
        [Required]
        [MaxLength(20)]
        [Column("discount_type")]
        public string DiscountType { get; set; } = "percent"; // "percent" or "fixed"

        // Размер скидки: для percent — от 1 до 100, для fixed — сумма в рублях
        [Required]
        [Range(0, 100000, ErrorMessage = "Скидка должна быть от 0")]
        [Column("discount_value", TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; }

        // Минимальная сумма заказа для применения промокода
        [Column("min_order_amount", TypeName = "decimal(10,2)")]
        public decimal MinOrderAmount { get; set; }

        // Максимальная сумма скидки (актуально для процентных промокодов)
        [Column("max_discount_amount", TypeName = "decimal(10,2)")]
        public decimal? MaxDiscountAmount { get; set; }

        // Максимальное количество использований (null = безлимит)
        [Column("max_uses")]
        public int? MaxUses { get; set; }

        // Текущее количество использований
        [Column("current_uses")]
        public int CurrentUses { get; set; }

        // Дата начала действия (null = бессрочно)
        [Column("valid_from")]
        public DateTime? ValidFrom { get; set; }

        // Дата окончания действия (null = бессрочно)
        [Column("valid_until")]
        public DateTime? ValidUntil { get; set; }

        // Активен ли промокод
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        // ID администратора, создавшего промокод
        [Column("created_by")]
        public int? CreatedBy { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Навигационные свойства
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public AppUser? Creator { get; set; }

        /// <summary>
        /// Вычисляет размер скидки для заданной суммы заказа
        /// </summary>
        public decimal CalculateDiscount(decimal orderTotal)
        {
            if (!IsActive) return 0;

            if (MaxUses.HasValue && CurrentUses >= MaxUses.Value) return 0;

            var now = DateTime.UtcNow;
            if (ValidFrom.HasValue && now < ValidFrom.Value) return 0;
            if (ValidUntil.HasValue && now > ValidUntil.Value) return 0;

            if (orderTotal < MinOrderAmount) return 0;

            decimal discount;
            if (DiscountType == "percent")
            {
                discount = orderTotal * (DiscountValue / 100);
                if (MaxDiscountAmount.HasValue)
                {
                    discount = Math.Min(discount, MaxDiscountAmount.Value);
                }
            }
            else // "fixed"
            {
                discount = DiscountValue;
                // Фиксированная скидка не может превышать сумму заказа
                discount = Math.Min(discount, orderTotal);
            }

            return Math.Round(discount, 2);
        }

        /// <summary>
        /// Проверяет, может ли промокод быть применён
        /// </summary>
        public bool IsValid(decimal orderTotal)
        {
            if (!IsActive) return false;

            if (MaxUses.HasValue && CurrentUses >= MaxUses.Value) return false;

            var now = DateTime.UtcNow;
            if (ValidFrom.HasValue && now < ValidFrom.Value) return false;
            if (ValidUntil.HasValue && now > ValidUntil.Value) return false;

            if (orderTotal < MinOrderAmount) return false;

            return true;
        }
    }
}
