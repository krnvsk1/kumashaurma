import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3001';

// Генерация ID сессии
const getSessionId = () => {
  let sessionId = localStorage.getItem('ai_chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ai_chat_session_id', sessionId);
  }
  return sessionId;
};

// Парсинг кода из ответа
const parseMessageContent = (content: string) => {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Текст до кода
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    // Блок кода
    parts.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'plaintext',
    });
    lastIndex = match.index + match[0].length;
  }

  // Оставшийся текст
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
};

// Компонент для отображения блока кода
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        mt: 1,
        mb: 1,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          bgcolor: 'rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Chip
          size="small"
          icon={<CodeIcon />}
          label={language}
          sx={{ fontSize: '0.7rem', height: 22 }}
        />
        <Tooltip title={copied ? 'Скопировано!' : 'Копировать'}>
          <IconButton size="small" onClick={handleCopy}>
            {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflow: 'auto',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {code}
      </Box>
    </Box>
  );
};

export const ChatModal: React.FC<ChatModalProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = getSessionId();

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Отправка сообщения
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(`Ошибка: ${errorMessage}`);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Очистка истории
  const handleClearHistory = async () => {
    try {
      await fetch(`${API_URL}/api/ai/chat/${sessionId}`, { method: 'DELETE' });
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  // Обработка Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Приветственное сообщение
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Привет! 👋 Я ИИ-ассистент проекта "Кума Шаурма". Могу помочь с:\n\n• Генерацией кода (React, TypeScript, C#)\n• Вопросами по архитектуре проекта\n• Отладкой и рефакторингом\n• Созданием новых компонентов и API\n\nЗадавай вопросы на русском языке!',
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, messages.length]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in={open}>
        <Paper
          elevation={24}
          sx={{
            width: { xs: '95%', sm: '90%', md: '70%', lg: '50%' },
            maxWidth: 800,
            height: { xs: '90vh', sm: '80vh' },
            maxHeight: 700,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BotIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  ИИ-ассистент
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Помощник разработчика
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title="Очистить историю">
                <IconButton
                  size="small"
                  onClick={handleClearHistory}
                  sx={{ color: 'white', mr: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Закрыть">
                <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: 'background.default',
            }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: msg.role === 'user' ? 'primary.light' : 'secondary.light',
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? (
                    <PersonIcon sx={{ fontSize: 20, color: 'white' }} />
                  ) : (
                    <BotIcon sx={{ fontSize: 20, color: 'white' }} />
                  )}
                </Box>

                {/* Message content */}
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: '80%',
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    border: msg.role === 'assistant' ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  {parseMessageContent(msg.content).map((part, idx) =>
                    part.type === 'code' ? (
                      <CodeBlock key={idx} code={part.content} language={part.language || 'plaintext'} />
                    ) : (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.6,
                        }}
                      >
                        {part.content}
                      </Typography>
                    )
                  )}
                </Paper>
              </Box>
            ))}

            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'secondary.light',
                  }}
                >
                  <BotIcon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Думаю...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Error */}
            {error && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                }}
              >
                <Typography variant="body2">{error}</Typography>
              </Paper>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Задайте вопрос о проекте..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                sx={{
                  minWidth: 48,
                  height: 48,
                  borderRadius: 3,
                }}
              >
                <SendIcon />
              </Button>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block', textAlign: 'center' }}
            >
              Enter — отправить • Shift+Enter — новая строка
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};

export default ChatModal;
