using System.ComponentModel.DataAnnotations;

namespace Kumashaurma.API.DTOs.Auth
{
    public class SendCodeDto
    {
        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$",
            ErrorMessage = "Invalid phone format. Use: +7 (999) 123-45-67")]
        public string Phone { get; set; } = string.Empty;
    }

    public class VerifyCodeDto
    {
        [Required(ErrorMessage = "Phone number is required")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Verification code is required")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "Code must be 4 digits")]
        public string Code { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required(ErrorMessage = "Phone number is required")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "First name must be 2-100 characters")]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters")]
        public string? LastName { get; set; }
    }

    public class RefreshTokenDto
    {
        [Required(ErrorMessage = "Refresh token is required")]
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
        public int? RetryAfter { get; set; }
    }
}
