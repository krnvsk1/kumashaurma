namespace Kumashaurma.API.Services
{
    public interface ISmsService
    {
        Task<(bool Success, string? Message)> SendVerificationCodeAsync(string phone, string code);
    }

    /// <summary>
    /// SMS service stub. In development mode, code is printed to console.
    /// In production, replace with real SMS gateway (SMSAero, SMSC, Twilio, etc.)
    /// </summary>
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;

        public SmsService(ILogger<SmsService> logger)
        {
            _logger = logger;
        }

        public Task<(bool Success, string? Message)> SendVerificationCodeAsync(string phone, string code)
        {
            _logger.LogInformation(
                "SMS CODE for {Phone}: {Code} (valid for 3 minutes)",
                phone, code);

            Console.WriteLine("\n" +
                "╔══════════════════════════════════════╗\n" +
                $"║  SMS for {phone,-26} ║\n" +
                $"║  Verification code: {code,-16} ║\n" +
                "║  Valid for 3 minutes                 ║\n" +
                "╚══════════════════════════════════════╝\n");

            return Task.FromResult((true, (string?)"Code sent successfully"));
        }
    }
}
