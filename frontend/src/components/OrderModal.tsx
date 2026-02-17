import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Snackbar,
  Slide,
  useTheme,
  Paper
} from '@mui/material';
import type { SlideProps } from '@mui/material';
import { 
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useCreateOrder } from '../api/hooks';
import type { CreateOrderDto } from '../types';
import { useCartStore } from '../store/cartStore';

const Transition = React.forwardRef<unknown, SlideProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  onBackToCart: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ open, onClose, onBackToCart }) => {
  const theme = useTheme();
  const createOrder = useCreateOrder();

  // Данные из корзины (только для чтения)
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

  // Поля заказа
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const totalAmount = React.useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      showSnackbar('Введите адрес доставки', 'error');
      return;
    }
    if (cartItems.length === 0) {
      showSnackbar('Корзина пуста', 'error');
      return;
    }

    const orderData: CreateOrderDto = {
      customerName: 'Гость',
      phone: 'Не указан',
      address: address.trim(),
      notes: notes.trim() || null,
      items: cartItems.map(item => ({
        shawarmaId: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const result = await createOrder.mutateAsync(orderData);
      
      showSnackbar(`Заказ #${result.id} создан успешно!`, 'success');
      
      clearCart();
      setAddress('');
      setNotes('');
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      showSnackbar(error.message || 'Ошибка при создании заказа', 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
          }
        }}
      >
        {/* Заголовок с кнопками */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onBackToCart} size="small" sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Оформление заказа
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {/* Адрес доставки */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Адрес доставки *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={createOrder.isPending}
              size="small"
              placeholder="ул. Ленина, д. 1, кв. 1"
            />
          </Box>

          {/* Состав заказа (только просмотр) */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Ваш заказ {cartItems.length > 0 && `(${cartItems.length} позиции)`}
          </Typography>

          {cartItems.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              Корзина пуста
            </Typography>
          ) : (
            <List sx={{ mb: 2 }}>
              {cartItems.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    mb: 1,
                    p: 1,
                    bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
                    borderRadius: 1.5,
                  }}
                >
                  <ListItem alignItems="center" disablePadding>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : '#334155',
                        }}
                      >
                        {item.images?.[0]?.filePath ? (
                          <img
                            src={`http://localhost:5199${item.images[0].filePath}`}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Typography component="span" sx={{ fontSize: '1.5rem' }}>
                            🥙
                          </Typography>
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} component="span">
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }} component="span">
                            <Typography variant="body2" color="text.secondary" component="span">
                              {item.quantity} × {item.price} ₽
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }} component="span">
                              = {item.price * item.quantity} ₽
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}

          {/* Комментарий к заказу */}
          <TextField
            fullWidth
            label="Комментарий к заказу"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={createOrder.isPending}
            multiline
            rows={2}
            size="small"
            placeholder="Пожелания по доставке, звонок в домофон и т.д."
            sx={{ mb: 2 }}
          />

          {/* Итого */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1.5,
            bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
            borderRadius: 2,
            mb: 1
          }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Итого:</Typography>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {totalAmount} ₽
            </Typography>
          </Box>

          {/* Заглушка для будущей авторизации */}
          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              🔐 В будущем здесь будут имя и телефон из профиля
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
        }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={
              cartItems.length === 0 || 
              !address.trim() || 
              createOrder.isPending
            }
            startIcon={createOrder.isPending ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.400' },
              py: 1.2
            }}
          >
            {createOrder.isPending ? 'Создание...' : 'Оформить заказ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderModal;