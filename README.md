# kumashaurma
Сервис Кума Шаурма — доставка шаурмы с веб-интерфейсом

## 🚀 Быстрый старт

### Предварительные требования

- .NET 9.0 SDK
- Node.js 18+ / Bun
- PostgreSQL

### Запуск Backend

```bash
cd src/Kumashaurma.API

# Настройка подключения к БД в appsettings.json
# Запуск миграций
dotnet ef database update

# Запуск сервера
dotnet run
```

Backend будет доступен на `http://localhost:5000`

### Запуск Frontend

```bash
cd frontend

# Установка зависимостей
npm install
# или
bun install

# Запуск dev сервера
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

### Запуск AI Service (ИИ-ассистент)

```bash
cd ai-service

# Установка зависимостей
npm install
# или
bun install

# Запуск
npm run dev
```

AI Service будет доступен на `http://localhost:3001`

## 🤖 ИИ-ассистент

В проект интегрирован ИИ-ассистент для помощи в разработке:

- **Генерация кода** — React компоненты, C# контроллеры, TypeScript типы
- **Вопросы по проекту** — архитектура, структура, паттерны
- **Отладка** — помощь в поиске и исправлении багов

### Использование

На любой странице нажмите на кнопку 🤖 в правом нижнем углу, чтобы открыть чат с ИИ-ассистентом.

## 📁 Структура проекта

```
kumashaurma/
├── src/
│   ├── Kumashaurma.API/       # Backend API (ASP.NET Core)
│   │   ├── Controllers/       # API контроллеры
│   │   ├── Models/           # Модели данных
│   │   ├── Services/         # Бизнес-логика
│   │   └── Data/             # DbContext, миграции
│   └── Kumashaurma.Core/     # Общая логика
├── frontend/                  # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── pages/           # Страницы
│   │   ├── api/             # API клиент
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript типы
│   └── public/
├── ai-service/               # AI микросервис (Node.js)
└── tests/                    # Тесты
```

## 🛠 Технологии

| Компонент | Технологии |
|-----------|------------|
| Backend | ASP.NET Core 9.0, Entity Framework, PostgreSQL |
| Frontend | React 18, TypeScript, Vite, Material UI |
| Auth | ASP.NET Identity, JWT, SMS-верификация |
| State | Zustand, React Query |
| AI | Node.js, z-ai-web-dev-sdk |

## 📋 Функционал

- ✅ Каталог меню с категориями и изображениями
- ✅ Система добавок к шаурме
- ✅ Корзина и оформление заказов
- ✅ Авторизация с SMS-верификацией
- ✅ Роли пользователей (admin, manager, user)
- ✅ Админ-панель с дашбордом
- ✅ Управление товарами и заказами
- ✅ Тёмная/светлая тема
- ✅ ИИ-ассистент для разработки

## 🔧 Конфигурация

### Backend (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5433;Database=kumashaurma_dev;Username=devuser;Password=dev123"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key",
    "Issuer": "Kumashaurma",
    "Audience": "KumashaurmaClient"
  }
}
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5199
VITE_MEDIA_URL=http://localhost:5199
```

`VITE_MEDIA_URL` используется для построения абсолютных URL к изображениям товаров. Если backend и frontend работают с одного origin и картинки доступны по относительным путям, переменную можно не задавать.

## 🚢 Деплой

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway/Render)
```bash
# Docker build
docker build -t kumashaurma-api ./src/Kumashaurma.API
```

## 📄 Лицензия

MIT License
