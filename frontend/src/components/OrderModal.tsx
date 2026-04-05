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
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import type { SlideProps } from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useCreateOrder } from '../api/hooks';
import type { CreateOrderDto, PromoCodeValidation } from '../types';
import { useCartStore } from '../store/cartStore';
import type { DeliveryType } from '../store/orderFlowStore';
import { resolveMediaUrl } from '../utils/media';

const Transition = React.forwardRef<unknown, SlideProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  deliveryType: DeliveryType;
  address: string;
  onAddressChange: (addr: string) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  promoInfo?: PromoCodeValidation | null;
}

const OrderModal: React.FC<OrderModalProps> = ({
  open,
  onClose,
  onBackToCart,
  deliveryType,
  address,
  onAddressChange,
  customerName,
  onCustomerNameChange,
  phone,
  onPhoneChange,
  promoInfo,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const createOrder = useCreateOrder();

  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

  const [notes, setNotes] = React.useState('');

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const totalAmount = React.useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const addonsTotal = item.selectedAddons?.reduce((s, a) => s + a.price * a.quantity, 0) || 0;
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = promoInfo?.discountAmount ?? 0;
  const finalTotal = Math.max(0, totalAmount - discountAmount);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      showSnackbar('Введите имя клиента', 'error');
      return;
    }
    if (!phone.trim()) {
      showSnackbar('Введите телефон', 'error');
      return;
    }
    if (deliveryType === 'Доставка' && !address.trim()) {
      showSnackbar('Введите адрес доставки', 'error');
      return;
    }
    if (cartItems.length === 0) {
      showSnackbar('Корзина пуста', 'error');
      return;
    }

    const orderData: CreateOrderDto = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: deliveryType === 'Доставка' ? address.trim() : 'Самовывоз',
      notes: notes.trim() || null,
      deliveryType: deliveryType,
      promoCodeId: promoInfo?.promoCodeId ?? null,
      items: cartItems.map(item => ({
        shawarmaId: item.id,
        quantity: item.quantity,
        name: item.name,
        selectedAddons: item.selectedAddons?.map(addon => ({
          addonId: addon.addonId,
          quantity: addon.quantity
        }))
      }))
    };

    try {
      const result = await createOrder.mutateAsync(orderData);
      showSnackbar(`Заказ #${result.id} создан успешно!`, 'success');
      clearCart();
      setNotes('');
      onCustomerNameChange(''); // Очищаем поле имени
      onPhoneChange(''); // Очищаем поле телефона
      onAddressChange(''); // Очищаем поле адреса
      setTimeout(() => onClose(), 1500);
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
        fullScreen={isMobile}
        fullWidth={!isMobile}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
          }
        }}
      >
        <DialogTitle sx={{
          position: 'relative',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <IconButton
            onClick={onBackToCart}
            size="small"
            sx={{
              position: 'absolute',
              left: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}
          >
            Оформление заказа
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Имя клиента "
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              margin="normal"
              required
              disabled={createOrder.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              fullWidth
              label="Телефон "
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              margin="normal"
              required
              disabled={createOrder.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            {deliveryType === 'Доставка' && (
              <TextField
                fullWidth
                label="Адрес доставки *"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                disabled={createOrder.isPending}
                placeholder="ул. Ленина, д. 1, кв. 1"
                sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            )}
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Ваш заказ {cartItems.length > 0 && `(${cartItems.length})`}
          </Typography>

          {cartItems.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Корзина пуста
            </Typography>
          ) : (
            <List sx={{ mb: 3 }}>
              {cartItems.map((item) => {
                const addonsTotal = item.selectedAddons?.reduce((s, a) => s + a.price * a.quantity, 0) || 0;
                const itemTotal = (item.price + addonsTotal) * item.quantity;

                return (
                  <Paper
                    key={item.uniqueKey || item.id}
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <ListItem alignItems="flex-start" disablePadding>
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#f8fafc',
                            borderRadius: 3,
                            mr: 2,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          {item.images?.[0]?.filePath ? (
                            <img
                              src={resolveMediaUrl(item.images[0].filePath)}
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                              <Box sx={{ mt: 0.5, mb: 0.5 }}>
                                {item.selectedAddons.map((addon, idx) => (
                                  <Typography
                                    key={idx}
                                    variant="caption"
                                    display="block"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.4 }}
                                  >
                                    • {addon.addonName} {addon.quantity > 1 ? `×${addon.quantity}` : ''} +{addon.price * addon.quantity} ₽
                                  </Typography>
                                ))}
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {item.quantity} × {item.price} ₽
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {itemTotal} ₽
                              </Typography>
                            </Box>

                            {item.specialInstructions && (
                              <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                                ✏️ {item.specialInstructions}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Paper>
                );
              })}
            </List>
          )}

          <TextField
            fullWidth
            label="Комментарий к заказу"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={createOrder.isPending}
            multiline
            rows={2}
            placeholder="Пожелания по доставке, звонок в домофон и т.д."
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === 'light' ? '#ecfeff' : 'rgba(8,145,178,0.08)',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Итого:</Typography>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2rem' }}>
                {finalTotal} ₽
              </Typography>
            </Box>
            {discountAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="success.main">Скидка по промокоду</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">−{discountAmount} ₽</Typography>
              </Box>
            )}
            {promoInfo && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                🏷️ {promoInfo.code} — {promoInfo.message}
              </Typography>
            )}
          </Paper>

          {/* Убираем заглушку, так как теперь поля ввода есть */}
          {/* <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" color="text.secondary">
              🔐 В будущем здесь будут имя и телефон из профиля
            </Typography>
          </Box> */}
        </DialogContent>

        <DialogActions sx={{
          p: isMobile ? 2 : 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
        }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={cartItems.length === 0 || createOrder.isPending ||
              (deliveryType === 'Доставка' && !address.trim()) ||
              !customerName.trim() || !phone.trim() // Добавлена валидация для имени и телефона
            }
            startIcon={createOrder.isPending ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              borderRadius: '9999px',
              py: isMobile ? 1.5 : 1.8,
              fontSize: isMobile ? '1rem' : '1.1rem',
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
          sx={{ width: '100%', borderRadius: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderModal;
