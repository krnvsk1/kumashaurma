using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            Console.WriteLine("🔍 Начало инициализации базы данных...");
            
            // Применяем миграции если есть
            context.Database.Migrate();
            
            Console.WriteLine("✅ Миграции применены");
            
            // Добавляем шаурму если таблица пустая
            if (!context.Shawarmas.Any())
            {
                Console.WriteLine("Таблица с шаурмой пустая");
            }
            else
            {
                var count = context.Shawarmas.Count();
                Console.WriteLine($"📊 В таблице уже есть {count} записей шаурмы");
            }
            
            // Добавляем тестовые заказы если нужно
            if (!context.Orders.Any())
            {
                Console.WriteLine("таблица заказов пустая");
            }
            else
            {
                var orderCount = context.Orders.Count();
                Console.WriteLine($"📊 В таблице уже есть {orderCount} заказов");
            }
            
            Console.WriteLine("🎉 Инициализация базы данных завершена успешно!");
        }
    }
}
