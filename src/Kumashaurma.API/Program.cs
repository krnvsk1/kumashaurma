using System;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Data;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5433;Database=kumashaurma_dev;Username=devuser;Password=dev123";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 👇 УПРОЩЁННЫЙ CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 👇 ВАЖНО: порядок!
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

// Seed database
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("🚀 Запуск инициализации базы данных...");
        DbInitializer.Initialize(dbContext);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Ошибка при инициализации базы данных: {ex.Message}");
    if (ex.InnerException != null)
        Console.WriteLine($"❌ Внутренняя ошибка: {ex.InnerException.Message}");
}

app.Run();