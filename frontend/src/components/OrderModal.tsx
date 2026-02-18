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

  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

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
            borderRadius: 6,
            bgcolor: 'background.paper',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
          }
        }}
      >
        {/* Заголовок */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          py: 3,
          px: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={onBackToCart} 
              size="small"
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Оформление заказа
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Адрес доставки */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Адрес доставки *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={createOrder.isPending}
              placeholder="ул. Ленина, д. 1, кв. 1"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
            />
          </Box>

          {/* Состав заказа */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Ваш заказ {cartItems.length > 0 && `(${cartItems.length})`}
          </Typography>

          {cartItems.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Корзина пуста
            </Typography>
          ) : (
            <List sx={{ mb: 3 }}>
              {cartItems.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    bgcolor: 'background.paper',
                  }}
                >
                  <ListItem alignItems="center" disablePadding>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: '#f8fafc',
                          borderRadius: 3,
                          mr: 2,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {item.images?.[0]?.filePath ? (
                          <img
                            src={`http://localhost:5199${item.images[0].filePath}`}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 12,
                            }}
                          />
                        ) : (
                          <Typography component="span" sx={{ fontSize: '1.8rem' }}>
                            🥙
                          </Typography>
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} component="span">
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Box component="span">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }} component="span">
                            <Typography variant="body2" color="text.secondary" component="span">
                              {item.quantity} × {item.price} ₽
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }} component="span">
                              {item.price * item.quantity} ₽
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

          {/* Комментарий */}
          <TextField
            fullWidth
            label="Комментарий к заказу"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={createOrder.isPending}
            multiline
            rows={2}
            placeholder="Пожелания по доставке, звонок в домофон и т.д."
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              }
            }}
          />

          {/* Итого */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Итого:</Typography>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 800 }}>
                {totalAmount} ₽
              </Typography>
            </Box>
          </Paper>

          {/* Заглушка авторизации */}
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="body2" color="text.secondary">
              🔐 В будущем здесь будут имя и телефон из профиля
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
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
              borderRadius: 3,
              py: 1.8,
              fontSize: '1.1rem',
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
          sx={{ 
            width: '100%',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderModal;