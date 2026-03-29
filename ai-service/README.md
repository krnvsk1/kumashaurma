# AI Service для Kumashaurma

ИИ-ассистент для помощи в разработке проекта "Кума Шаурма".

## Описание

Микросервис на Node.js, использующий `z-ai-web-dev-sdk` для взаимодействия с LLM и предоставления контекстно-зависимых ответов о проекте.

## Установка

```bash
cd ai-service
npm install
# или
bun install
```

## Запуск

### Разработка
```bash
npm run dev
# или
bun run dev
```

### Продакшн
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/ai/chat

Отправка сообщения в чат с ИИ-ассистентом.

**Request:**
```json
{
  "message": "Как создать новый компонент React?",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Для создания нового компонента...",
  "sessionId": "session_123"
}
```

### POST /api/ai/generate

Генерация кода по описанию.

**Request:**
```json
{
  "prompt": "Создай хук для получения списка заказов",
  "language": "typescript",
  "context": "import { useQuery } from '@tanstack/react-query'..."
}
```

**Response:**
```json
{
  "success": true,
  "code": "export const useOrders = () => {...}",
  "language": "typescript"
}
```

### DELETE /api/ai/chat/:sessionId

Очистка истории чата.

### GET /health

Health check endpoint.

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | 3001 |

## Структура

```
ai-service/
├── src/
│   └── index.ts      # Основной файл сервиса
├── package.json
├── tsconfig.json
└── README.md
```

## Контекст проекта

Системный промпт содержит:
- Описание проекта "Кума Шаурма"
- Технический стек (ASP.NET Core, React, PostgreSQL)
- Структуру Backend и Frontend
- Ключевые сущности (Shawarma, Order, Addon, AppUser)
- API Endpoints
- Соглашения по коду

Это позволяет ИИ давать релевантные ответы в контексте конкретного проекта.
