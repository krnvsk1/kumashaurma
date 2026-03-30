import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, Phone as PhoneIcon, Sms as SmsIcon, Person as PersonIcon } from '@mui/icons-material';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'verify' | 'register';

interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    phone: string;
    firstName?: string;
    lastName?: string;
    phoneVerified: boolean;
    roles: string[];
  };
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { setAuth } = useAuthStore();

  // Форматирование телефона
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+7 (${digits}`;
    if (digits.length <= 4) return `+7 (${digits.slice(1, 4)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(value);
    setError('');
  };

  // Отправка кода
  const handleSendCode = async () => {
    if (phone.length < 18) {
      setError('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post<AuthResponse>('/auth/send-code', { phone });

      if (response.data.success) {
        setStep('verify');
        setCountdown(60);
        // Обратный отсчёт
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.message || "Ошибка отправки кода");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  };

  // Проверка кода
  const handleVerifyCode = async () => {
    if (code.length !== 4) {
      setError("Введите 4 цифры кода");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post<AuthResponse>("/auth/verify", { phone, code });

      if (response.data.success) {
        if (response.data.accessToken && response.data.user) {
          // Пользователь уже зарегистрирован - входим
          setAuth(response.data.user, response.data.accessToken, response.data.refreshToken || "");
          onClose();
          resetForm();
        } else {
          // Новый пользователь - нужно зарегистрироваться
          setStep("register");
        }
      } else {
        setError(response.data.message || "Неверный код");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Ошибка проверки кода");
    } finally {
      setLoading(false);
    }
  };

  // Регистрация
  const handleRegister = async () => {
    if (!firstName.trim()) {
      setError("Введите имя");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", {
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });

      if (response.data.success && response.data.accessToken && response.data.user) {
        setAuth(response.data.user, response.data.accessToken, response.data.refreshToken || "");
        onClose();
        resetForm();
      } else {
        setError(response.data.message || "Ошибка регистрации");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (countdown > 0) return;
    await handleSendCode();
  };

  // Сброс формы
  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setFirstName('');
    setLastName('');
    setError('');
    setCountdown(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {step === 'phone' && 'Вход в аккаунт'}
          {step === 'verify' && 'Подтверждение'}
          {step === 'register' && 'Регистрация'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Шаг 1: Ввод телефона */}
        {step === 'phone' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Введите номер телефона для входа или регистрации
            </Typography>

            <TextField
              fullWidth
              label="Номер телефона"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (999) 123-45-67"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              autoFocus
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSendCode}
              disabled={loading || phone.length < 18}
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Получить код'}
            </Button>
          </Box>
        )}

        {/* Шаг 2: Ввод кода */}
        {step === 'verify' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Код отправлен на номер:
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
              {phone}
            </Typography>

            <TextField
              fullWidth
              label="Код из SMS"
              value={code}
              onChange={handleCodeChange}
              placeholder="0000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SmsIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              autoFocus
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 4}
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Подтвердить'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={handleResendCode}
                disabled={countdown > 0}
                sx={{ textTransform: 'none' }}
              >
                {countdown > 0 ? `Отправить повторно через ${countdown} сек` : 'Отправить код повторно'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Шаг 3: Регистрация */}
        {step === 'register' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Телефон подтверждён! Заполните данные для завершения регистрации
            </Typography>

            <TextField
              fullWidth
              label="Имя *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              autoFocus
            />

            <TextField
              fullWidth
              label="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleRegister}
              disabled={loading || !firstName.trim()}
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
        </Typography>
      </DialogContent>
    </Dialog>
  );
}