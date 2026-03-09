using System.ComponentModel.DataAnnotations;

namespace Kumashaurma.API.DTOs.Auth
{
    public class SendCodeDto
    {
        [Required(ErrorMessage = "Номер телефона обязателен")]
        [RegularExpression(@"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$", 
            ErrorMessage = "Неверный формат телефона. Используйте формат: +7 (999) 123-45-67")]
        public string Phone { get; set; } = string.Empty;
    }

    public class VerifyCodeDto
    {
        [Required(ErrorMessage = "Номер телефона обязателен")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Код подтверждения обязателен")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "Код должен содержать 4 цифры")]
        public string Code { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Номер телефона обязателен")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Имя обязательно")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Имя должно содержать от 2 до 100 символов")]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Фамилия не должна превышать 100 символов")]
        public string? LastName { get; set; }
    }

    public class RefreshTokenDto
    {
        [Required(ErrorMessage = "Refresh токен обязателен")]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public UserDto? User { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool PhoneVerified { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class SendCodeResponseDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int? RetryAfter { get; set; } // seconds until next code can be sent
    }
}
