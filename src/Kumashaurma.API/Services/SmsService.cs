namespace Kumashaurma.API.Services
{
    public interface ISmsService
    {
        Task<SmsResult> SendVerificationCodeAsync(string phone, string code);
    }

    public class SmsResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public string? ErrorCode { get; set; }
    }

    /// <summary>
    /// Заглушка для SMS-сервиса. В development режиме код выводится в консоль.
    /// В production нужно заменить на реальный SMS-шлюз (SMSAero, SMSC, Twilio и т.д.)
    /// </summary>
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;

        public SmsService(ILogger<SmsService> logger)
        {
            _logger = logger;
        }

        public Task<SmsResult> SendVerificationCodeAsync(string phone, string code)
        {
            // Заглушка - в development режиме выводим код в консоль/лог
            _logger.LogInformation(
                "📱 SMS CODE для {Phone}: {Code} (действителен 3 минуты)", 
                phone, code);
            
            Console.WriteLine($"\n" +
                "╔══════════════════════════════════════╗\n" +
                $"║  📱 SMS для {phone,-20} ║\n" +
                $"║  Код подтверждения: {code,-16} ║\n" +
                "║  Действителен 3 минуты               ║\n" +
                "╚══════════════════════════════════════╝\n");

            return Task.FromResult(new SmsResult
            {
                Success = true,
                Message = "Код успешно отправлен"
            });
        }
    }
}
