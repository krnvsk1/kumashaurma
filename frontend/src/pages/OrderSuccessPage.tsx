import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  AccessTime as TimeIcon,
  ShoppingCart as CartIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrder } from '../api/hooks';

// Animated checkmark circle using @keyframes
const checkmarkKeyframes = `
  @keyframes checkScale {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeUp {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  @keyframes confettiDrop {
    0% { transform: translateY(-10px); opacity: 1; }
    100% { transform: translateY(0); opacity: 1; }
  }
`;

const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const orderId = Number(id);
  const { data: order, isLoading, error } = useOrder(orderId);

  // Estimated delivery time (30-45 minutes from order creation)
  const estimatedDelivery = React.useMemo(() => {
    if (!order?.createdAt) return '30–45 минут';
    const created = new Date(order.createdAt);
    const min = new Date(created.getTime() + 30 * 60 * 1000);
    const max = new Date(created.getTime() + 45 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(min)} — ${fmt(max)}`;
  }, [order?.createdAt]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography color="text.secondary">Загрузка информации о заказе…</Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
          px: 2,
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Не удалось загрузить информацию о заказе
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/orders')}
          sx={{ borderRadius: '9999px', px: 4 }}
        >
          Перейти к заказам
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: 'calc(100vh - 200px)', sm: '70vh' },
        px: 2,
        py: 4,
      }}
    >
      <style>{checkmarkKeyframes}</style>

      {/* Animated checkmark */}
      <Box
        sx={{
          width: { xs: 96, sm: 120 },
          height: { xs: 96, sm: 120 },
          borderRadius: '50%',
          bgcolor:
            theme.palette.mode === 'light'
              ? '#ecfdf5'
              : 'rgba(16, 185, 129, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          animation: 'checkScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          border: `3px solid ${theme.palette.mode === 'light' ? '#a7f3d0' : 'rgba(16,185,129,0.3)'}`,
        }}
      >
        <CheckIcon
          sx={{
            fontSize: { xs: 56, sm: 72 },
            color: '#10b981',
          }}
        />
      </Box>

      {/* Heading */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          mb: 1,
          animation: 'fadeUp 0.5s ease-out 0.3s both',
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        Заказ успешно оформлен!
      </Typography>

      {/* Order number */}
      <Typography
        variant="h6"
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          mb: 3,
          animation: 'fadeUp 0.5s ease-out 0.45s both',
        }}
      >
        Заказ #{order.id}
      </Typography>

      {/* Info card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          p: { xs: 2.5, sm: 3 },
          mb: 4,
          animation: 'fadeUp 0.5s ease-out 0.6s both',
        }}
      >
        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip
            label={order.status}
            sx={{
              bgcolor:
                theme.palette.mode === 'light'
                  ? '#ecfdf5'
                  : 'rgba(16,185,129,0.12)',
              color: '#10b981',
              fontWeight: 600,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            от{' '}
            {new Date(order.createdAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Estimated delivery */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              {order.deliveryType === 'Доставка'
                ? 'Ориентировочное время доставки'
                : 'Будет готов к самовывозу'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {estimatedDelivery}
            </Typography>
          </Box>
        </Box>

        {/* Address */}
        {order.address && order.address !== 'Самовывоз' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <HomeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Адрес доставки
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {order.address}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Total */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Сумма заказа
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: 'primary.main', fontWeight: 800 }}
          >
            {order.total} ₽
          </Typography>
        </Box>
      </Paper>

      {/* Action buttons */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 440,
          animation: 'fadeUp 0.5s ease-out 0.75s both',
        }}
      >
        <Button
          variant="contained"
          component={Link}
          to="/orders"
          startIcon={<CartIcon />}
          fullWidth
          sx={{
            borderRadius: '9999px',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Перейти к заказам
        </Button>
        <Button
          variant="outlined"
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
          fullWidth
          sx={{
            borderRadius: '9999px',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Вернуться в меню
        </Button>
      </Box>
    </Box>
  );
};

export default OrderSuccessPage;
