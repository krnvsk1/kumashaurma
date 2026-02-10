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
                Console.WriteLine("📦 Добавляем тестовые данные шаурмы...");
                
                var shawarmas = new[]
                {
                    new Shawarma 
                    { 
                        Name = "Классическая шаурма", 
                        Price = 250, 
                        Description = "С курицей, свежими овощами и соусом", 
                        Category = "Курица" 
                    },
                    new Shawarma 
                    { 
                        Name = "Острая шаурма", 
                        Price = 280, 
                        Description = "С острой курицей и перцем", 
                        Category = "Курица", 
                        IsSpicy = true 
                    },
                    new Shawarma 
                    { 
                        Name = "Шаурма с сыром", 
                        Price = 320, 
                        Description = "С двойным сыром", 
                        Category = "Курица", 
                        HasCheese = true 
                    },
                    new Shawarma 
                    { 
                        Name = "Вегетарианская", 
                        Price = 220, 
                        Description = "Только свежие овощи", 
                        Category = "Вегетарианская" 
                    },
                    new Shawarma 
                    { 
                        Name = "Детская шаурма", 
                        Price = 180, 
                        Description = "Маленькая порция, неострая", 
                        Category = "Курица" 
                    },
                    new Shawarma 
                    { 
                        Name = "Люля-шаурма", 
                        Price = 350, 
                        Description = "С люля-кебабом из баранины", 
                        Category = "Баранина" 
                    },
                    new Shawarma 
                    { 
                        Name = "Мексиканская", 
                        Price = 300, 
                        Description = "С фасолью, кукурузой и перцем", 
                        Category = "Курица", 
                        IsSpicy = true 
                    }
                };

                context.Shawarmas.AddRange(shawarmas);
                var changes = context.SaveChanges();
                
                Console.WriteLine($"✅ Добавлено {changes} записей шаурмы");
                Console.WriteLine("📊 Добавленные позиции:");
                foreach (var s in shawarmas)
                {
                    Console.WriteLine($"  - {s.Name}: {s.Price} руб. ({s.Category})");
                }
            }
            else
            {
                var count = context.Shawarmas.Count();
                Console.WriteLine($"📊 В таблице уже есть {count} записей шаурмы");
            }
            
            // Добавляем тестовые заказы если нужно
            if (!context.Orders.Any())
            {
                Console.WriteLine("📦 Добавляем тестовые заказы...");
                
                // Сначала получим ID существующей шаурмы
                var shawarma = context.Shawarmas.FirstOrDefault();
                if (shawarma != null)
                {
                    var orders = new[]
                    {
                        new Order
                        {
                            CustomerName = "Иван Иванов",
                            Phone = "+7 999 123-45-67",
                            Address = "ул. Ленина, д. 10",
                            Total = 530,
                            Status = "Выполнен",
                            Notes = "Без лука",
                            CreatedAt = DateTime.UtcNow.AddDays(-1),
                            Items = new List<OrderItem>
                            {
                                new OrderItem 
                                { 
                                    ShawarmaId = shawarma.Id,
                                    Name = shawarma.Name,
                                    Quantity = 2,
                                    Price = shawarma.Price
                                }
                            }
                        },
                        new Order
                        {
                            CustomerName = "Мария Петрова",
                            Phone = "+7 999 234-56-78",
                            Address = "пр. Мира, д. 25",
                            Total = 320,
                            Status = "В процессе",
                            Notes = "Позвонить за 10 минут",
                            CreatedAt = DateTime.UtcNow.AddHours(-3),
                            Items = new List<OrderItem>
                            {
                                new OrderItem 
                                { 
                                    ShawarmaId = shawarma.Id,
                                    Name = shawarma.Name,
                                    Quantity = 1,
                                    Price = shawarma.Price
                                }
                            }
                        }
                    };
                    
                    context.Orders.AddRange(orders);
                    var orderChanges = context.SaveChanges();
                    Console.WriteLine($"✅ Добавлено {orderChanges} заказов");
                }
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
