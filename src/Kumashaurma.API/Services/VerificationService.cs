using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Services
{
    public interface IVerificationService
    {
        Task<(bool Success, string Message, int? RetryAfter)> CreateAndSendCodeAsync(string phone);
        Task<(bool Success, string Message)> VerifyCodeAsync(string phone, string code);
    }

    public class VerificationService : IVerificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ISmsService _smsService;
        private readonly ILogger<VerificationService> _logger;

        private const int CodeLifetimeMinutes = 3;
        private const int MaxAttempts = 3;
        private const int BlockDurationMinutes = 5;
        private const int ResendCooldownSeconds = 30;

        public VerificationService(
            ApplicationDbContext context,
            ISmsService smsService,
            ILogger<VerificationService> logger)
        {
            _context = context;
            _smsService = smsService;
            _logger = logger;
        }

        public async Task<(bool Success, string Message, int? RetryAfter)> CreateAndSendCodeAsync(string phone)
        {
            var normalizedPhone = NormalizePhone(phone);

            var existingCode = await _context.SmsVerificationCodes
                .Where(c => c.Phone == normalizedPhone)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingCode != null)
            {
                if (existingCode.IsBlocked)
                {
                    var remainingBlock = existingCode.BlockedUntil!.Value - DateTime.UtcNow;
                    return (false,
                        $"Too many attempts. Try again in {(int)remainingBlock.TotalMinutes + 1} min",
                        Math.Max(0, (int)remainingBlock.TotalSeconds));
                }

                var timeSinceCreation = DateTime.UtcNow - existingCode.CreatedAt;
                if (timeSinceCreation.TotalSeconds < ResendCooldownSeconds)
                {
                    var retryAfter = ResendCooldownSeconds - (int)timeSinceCreation.TotalSeconds;
                    return (false,
                        $"Wait {retryAfter} seconds before resending",
                        retryAfter);
                }

                _context.SmsVerificationCodes.Remove(existingCode);
            }

            var code = GenerateCode();
            var verificationCode = new SmsVerificationCode
            {
                Phone = normalizedPhone,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(CodeLifetimeMinutes),
                CreatedAt = DateTime.UtcNow
            };

            _context.SmsVerificationCodes.Add(verificationCode);
            await _context.SaveChangesAsync();

            var (smsSuccess, smsMessage) = await _smsService.SendVerificationCodeAsync(normalizedPhone, code);

            if (!smsSuccess)
            {
                return (false, smsMessage ?? "Failed to send SMS", null);
            }

            return (true, "Verification code sent", null);
        }

        public async Task<(bool Success, string Message)> VerifyCodeAsync(string phone, string code)
        {
            var normalizedPhone = NormalizePhone(phone);

            var verificationCode = await _context.SmsVerificationCodes
                .Where(c => c.Phone == normalizedPhone)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (verificationCode == null)
            {
                return (false, "Code not found. Request a new code");
            }

            if (verificationCode.IsBlocked)
            {
                return (false, "Too many attempts. Request a new code");
            }

            if (verificationCode.IsExpired)
            {
                return (false, "Code expired. Request a new code");
            }

            if (verificationCode.IsVerified)
            {
                return (false, "Code already used");
            }

            verificationCode.Attempts++;

            if (verificationCode.Code != code)
            {
                if (verificationCode.Attempts >= MaxAttempts)
                {
                    verificationCode.BlockedUntil = DateTime.UtcNow.AddMinutes(BlockDurationMinutes);
                    await _context.SaveChangesAsync();
                    return (false,
                        $"Too many attempts. Try again in {BlockDurationMinutes} minutes");
                }

                await _context.SaveChangesAsync();
                var remainingAttempts = MaxAttempts - verificationCode.Attempts;
                return (false,
                    $"Invalid code. {remainingAttempts} attempts remaining");
            }

            verificationCode.VerifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Code verified");
        }

        private static string NormalizePhone(string phone)
        {
            var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());

            if (digits.StartsWith("8") && digits.Length == 11)
            {
                digits = "+7" + digits[1..];
            }

            if (!digits.StartsWith("+"))
            {
                digits = "+7" + digits;
            }

            return digits;
        }

        private static string GenerateCode()
        {
            var bytes = new byte[2];
            RandomNumberGenerator.Fill(bytes);
            var value = (bytes[0] << 8) | bytes[1];
            return (value % 10000).ToString("D4");
        }
    }
}
