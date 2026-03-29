import express, { Request, Response } from 'express';
import cors from 'cors';
import ZAI from 'z-ai-web-dev-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://kumashaurma-frontend.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Системный промпт с контекстом проекта
const SYSTEM_PROMPT = `Ты — ИИ-ассистент для проекта "Кума Шаурма". Ты помогаешь разработчикам работать с кодовой базой проекта.

## О проекте
"Кума Шаурма" — это сервис доставки шаурмы с веб-интерфейсом.

## Технический стек
- **Backend**: ASP.NET Core 9.0, Entity Framework Core, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Material UI
- **Auth**: ASP.NET Identity, JWT, SMS-верификация
- **State**: Zustand (auth, cart), React Query (server state)

## Структура Backend (C#)
- \`/src/Kumashaurma.API/\` - основной API проект
- \`/src/Kumashaurma.API/Controllers/\` - контроллеры (ShawarmaController, OrdersController, AuthController, etc.)
- \`/src/Kumashaurma.API/Models/\` - модели данных (Shawarma, Order, AppUser, etc.)
- \`/src/Kumashaurma.API/Data/\` - DbContext и миграции
- \`/src/Kumashaurma.API/Services/\` - сервисы (TokenService, SmsService, etc.)

## Структура Frontend (React/TypeScript)
- \`/frontend/src/components/\` - React компоненты
- \`/frontend/src/pages/\` - страницы (MenuPage, DashboardPage, OrdersPage, etc.)
- \`/frontend/src/api/\` - API клиент и хуки
- \`/frontend/src/store/\` - Zustand stores (authStore, cartStore)
- \`/frontend/src/types/\` - TypeScript типы

## Ключевые сущности
- **Shawarma** - товар меню с категориями, ценой, изображениями
- **Order** - заказ с элементами (OrderItem) и статусами
- **Addon** - добавки к шаурме (соусы, начинки)
- **AppUser** - пользователь с ролями (admin, manager, user)

## API Endpoints
- \`GET /api/shawarma\` - список меню
- \`POST /api/orders\` - создать заказ
- \`GET /api/orders\` - список заказов (admin)
- \`POST /api/auth/login\`, \`POST /api/auth/register\` - авторизация

## Соглашения по коду
- Backend: PascalCase для классов/методов, camelCase для локальных переменных
- Frontend: camelCase для переменных/функций, PascalCase для компонентов
- Используем async/await вместо .then/.catch
- Material UI для стилизации компонентов

Отвечай на русском языке. Давай конкретные примеры кода, когда это уместно. Если не знаешь ответа — честно скажи об этом.`;

// Инициализация ZAI
let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function initZAI() {
  if (!zai) {
    zai = await ZAI.create();
  }
  return zai;
}

// Хранилище историй чатов (в памяти, для продакшена нужно использовать Redis/DB)
const chatHistories = new Map<string, Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>();

// Endpoint для чата
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = await initZAI();

    // Получаем или создаём историю чата
    let history = chatHistories.get(sessionId);
    if (!history) {
      history = [{ role: 'system', content: SYSTEM_PROMPT }];
      chatHistories.set(sessionId, history);
    }

    // Добавляем сообщение пользователя
    history.push({ role: 'user', content: message });

    // Вызываем LLM
    const completion = await ai.chat.completions.create({
      messages: history,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ.';

    // Добавляем ответ ассистента в историю
    history.push({ role: 'assistant', content: assistantMessage });

    // Ограничиваем историю (оставляем последние 20 сообщений + системный промпт)
    if (history.length > 21) {
      const systemPrompt = history[0];
      history = [systemPrompt, ...history.slice(-20)];
      chatHistories.set(sessionId, history);
    }

    res.json({
      success: true,
      message: assistantMessage,
      sessionId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint для генерации кода
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, language = 'typescript', context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = await initZAI();

    const generatePrompt = `${SYSTEM_PROMPT}

## Задача: Генерация кода
Язык: ${language}
${context ? `Контекст:\n${context}\n` : ''}

Сгенерируй код для следующей задачи:
${prompt}

Верни только код с минимальными комментариями. Используй современные практики и паттерны.`;

    const completion = await ai.chat.completions.create({
      messages: [{ role: 'user', content: generatePrompt }],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const code = completion.choices[0]?.message?.content || 'Не удалось сгенерировать код.';

    res.json({
      success: true,
      code,
      language
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint для очистки истории
app.delete('/api/ai/chat/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  chatHistories.delete(sessionId);
  res.json({ success: true, message: 'Chat history cleared' });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'kumashaurma-ai' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`📚 Endpoints:`);
  console.log(`   POST /api/ai/chat - Chat with AI assistant`);
  console.log(`   POST /api/ai/generate - Generate code`);
  console.log(`   DELETE /api/ai/chat/:sessionId - Clear chat history`);
});
