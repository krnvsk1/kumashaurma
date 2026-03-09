using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Services
{
    public interface IVerificationService
    {
        Task<(bool Success, string Message, int? RetryAfter)> CreateAndSendCodeAsync(string phone);
        Task<(bool Success, string Message)> VerifyCodeAsync(string phone, string code);
        Task CleanupExpiredCodesAsync();
    }

    public class VerificationService : IVerificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ISmsService _smsService;
        private readonly ILogger<VerificationService> _logger;

        private const int CodeLength = 4;
        private const int CodeLifetimeMinutes = 3;
        private const int MaxAttempts = 3;
        private const int BlockDurationMinutes = 5;
        private const int ResendCooldownSeconds = 60;

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
            // Нормализуем телефон (убираем все кроме цифр и плюса)
            var normalizedPhone = NormalizePhone(phone);

            // Проверяем, есть ли активный код
            var existingCode = await _context.SmsVerificationCodes
                .Where(c => c.Phone == normalizedPhone)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingCode != null)
            {
                // Проверяем блокировку
                if (existingCode.IsBlocked)
                {
                    var remainingBlock = existingCode.BlockedUntil!.Value - DateTime.UtcNow;
                    return (false, 
                        $"Превышено количество попыток. Попробуйте через {(int)remainingBlock.TotalMinutes + 1} мин", 
                        (int)remainingBlock.TotalSeconds);
                }

                // Проверяем cooldown для повторной отправки
                var timeSinceCreation = DateTime.UtcNow - existingCode.CreatedAt;
                if (timeSinceCreation.TotalSeconds < ResendCooldownSeconds)
                {
                    var retryAfter = ResendCooldownSeconds - (int)timeSinceCreation.TotalSeconds;
                    return (false, 
                        $"Подождите {retryAfter} сек перед повторной отправкой", 
                        retryAfter);
                }

                // Удаляем старый код
                _context.SmsVerificationCodes.Remove(existingCode);
            }

            // Генерируем новый код
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

            // Отправляем SMS
            var smsResult = await _smsService.SendVerificationCodeAsync(normalizedPhone, code);

            if (!smsResult.Success)
            {
                return (false, smsResult.Message ?? "Ошибка отправки SMS", null);
            }

            return (true, "Код подтверждения отправлен", null);
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
                return (false, "Код не найден. Запросите новый код");
            }

            // Проверяем блокировку
            if (verificationCode.IsBlocked)
            {
                return (false, "Превышено количество попыток. Запросите новый код");
            }

            // Проверяем, не истёк ли код
            if (verificationCode.IsExpired)
            {
                return (false, "Код истёк. Запросите новый код");
            }

            // Проверяем, не был ли код уже использован
            if (verificationCode.IsVerified)
            {
                return (false, "Код уже был использован");
            }

            // Увеличиваем счётчик попыток
            verificationCode.Attempts++;

            // Проверяем код
            if (verificationCode.Code != code)
            {
                // Проверяем, не превысил ли пользователь лимит попыток
                if (verificationCode.Attempts >= MaxAttempts)
                {
                    verificationCode.BlockedUntil = DateTime.UtcNow.AddMinutes(BlockDurationMinutes);
                    await _context.SaveChangesAsync();
                    return (false, 
                        $"Превышено количество попыток. Попробуйте через {BlockDurationMinutes} мин");
                }

                await _context.SaveChangesAsync();
                var remainingAttempts = MaxAttempts - verificationCode.Attempts;
                return (false, 
                    $"Неверный код. Осталось попыток: {remainingAttempts}");
            }

            // Код верный - помечаем как проверенный
            verificationCode.VerifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Код подтверждён");
        }

        public async Task CleanupExpiredCodesAsync()
        {
            var expiredCodes = await _context.SmsVerificationCodes
                .Where(c => c.ExpiresAt < DateTime.UtcNow || c.BlockedUntil < DateTime.UtcNow)
                .ToListAsync();

            if (expiredCodes.Any())
            {
                _context.SmsVerificationCodes.RemoveRange(expiredCodes);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Удалено {Count} истекших кодов верификации", expiredCodes.Count);
            }
        }

        private static string NormalizePhone(string phone)
        {
            // Убираем всё кроме цифр и плюса
            var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
            
            // Если начинается с 8, заменяем на +7
            if (digits.StartsWith("8") && digits.Length == 11)
            {
                digits = "+7" + digits[1..];
            }
            
            // Если не начинается с +, добавляем +7
            if (!digits.StartsWith("+"))
            {
                digits = "+7" + digits;
            }

            return digits;
        }

        private static string GenerateCode()
        {
            var random = new Random();
            return random.Next(0, 10000).ToString("D4");
        }
    }
}
