import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  List,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useCreateOrder } from '../api/hooks';
import type { CreateOrderDto } from '../types';
import { useCartStore, useTotalPrice, useTotalItems } from '../store/cartStore';

const CreateOrderPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const createOrder = useCreateOrder();

  // Получаем данные из корзины
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  
  const totalAmount = useTotalPrice();
  const totalItems = useTotalItems();

  // Поля клиента
  const [customerName, setCustomerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Функция для обработки изменения количества
  const handleQuantityChange = (uniqueKey: string, delta: number) => {
    console.log('🔧 Изменение количества:', { uniqueKey, delta });
    const item = cartItems.find(item => item.uniqueKey === uniqueKey);
    if (item) {
      const newQuantity = item.quantity + delta;
      console.log('📊 Новое количество:', newQuantity);
      updateQuantity(uniqueKey, newQuantity);
    } else {
      console.log('❌ Товар не найден:', uniqueKey);
    }
  };

  // Отправка заказа
  const handleSubmit = async () => {
    // Валидация
    if (!customerName.trim()) {
      showSnackbar('Введите имя клиента', 'error');
      return;
    }
    if (!phone.trim()) {
      showSnackbar('Введите телефон', 'error');
      return;
    }
    if (cartItems.length === 0) {
      showSnackbar('Корзина пуста', 'error');
      return;
    }

    React.useEffect(() => {
      console.log('🛒 Текущая корзина:', cartItems);
    }, [cartItems]);

    // Подготавливаем данные
    const orderData: CreateOrderDto = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Самовывоз',
      notes: notes.trim() || null,
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
      
      // Очищаем корзину после успешного заказа
      clearCart();
      
      // Сбрасываем форму
      setCustomerName('');
      setPhone('');
      setAddress('');
      setNotes('');
      
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
      
    } catch (error: any) {
      showSnackbar(error.message || 'Ошибка при создании заказа', 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ 
      p: 3,
      maxWidth: 1200,
      mx: 'auto',
      width: '100%'
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Оформление заказа
      </Typography>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        {/* Левая колонка - информация о клиенте */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Информация о клиенте
              </Typography>
              
              <TextField
                fullWidth
                label="Имя клиента *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                margin="normal"
                required
                disabled={createOrder.isPending}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              
              <TextField
                fullWidth
                label="Телефон *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                required
                disabled={createOrder.isPending}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              
              <TextField
                fullWidth
                label="Адрес доставки"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                margin="normal"
                disabled={createOrder.isPending}
                helperText="Оставьте пустым для самовывоза"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              
              <TextField
                fullWidth
                label="Примечания к заказу"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                disabled={createOrder.isPending}
                placeholder="Например: без лука, позвонить заранее, код домофона..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </CardContent>
          </Card>

          {/* Информация о количестве */}
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="body1" color="text.secondary">
              Всего позиций: <strong>{totalItems}</strong>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Сумма заказа: <strong>{totalAmount} ₽</strong>
            </Typography>
          </Paper>
        </Box>
        
        {/* Правая колонка - корзина */}
        <Box>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Состав заказа {cartItems.length > 0 && `(${cartItems.length} позиций)`}
              </Typography>
              
              {cartItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Корзина пуста
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/menu')}
                    sx={{ mt: 2, borderRadius: 3 }}
                  >
                    Перейти в меню
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {cartItems.map((item) => {
                    const itemTotal = (item.price + 
                      (item.selectedAddons?.reduce((sum, a) => sum + a.price * a.quantity, 0) || 0)
                    ) * item.quantity;
                    
                    return (
                      <React.Fragment key={item.uniqueKey}>
                        <Paper
                          variant="outlined"
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            borderRadius: 3,
                            position: 'relative'
                          }}
                        >
                          {/* Верхняя часть товара */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {item.name}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQuantityChange(item.uniqueKey!, -1)}
                                    disabled={item.quantity <= 1 || createOrder.isPending}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                                    {item.quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQuantityChange(item.uniqueKey!, 1)}
                                    disabled={createOrder.isPending}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary">
                                  × {item.price} ₽
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" color="primary.main" fontWeight={600}>
                                {itemTotal} ₽
                              </Typography>
                              <IconButton 
                                edge="end" 
                                onClick={() => removeItem(item.uniqueKey!)}
                                disabled={createOrder.isPending}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>

                          {/* Отображение добавок */}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <Box sx={{ mt: 2, pl: 0 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Добавки:
                              </Typography>
                              {item.selectedAddons.map((addon, idx) => (
                                <Box 
                                  key={idx}
                                  sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 0.5,
                                    pl: 2
                                  }}
                                >
                                  <Typography variant="body2">
                                    • {addon.addonName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {addon.quantity > 1 && (
                                      <Typography variant="body2" color="text.secondary">
                                        ×{addon.quantity}
                                      </Typography>
                                    )}
                                    <Typography variant="body2" color="primary.main">
                                      +{addon.price * addon.quantity} ₽
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Особые пожелания */}
                          {item.specialInstructions && (
                            <Box sx={{ 
                              mt: 2, 
                              p: 1.5, 
                              bgcolor: alpha(theme.palette.info.main, 0.05),
                              borderRadius: 2,
                              fontSize: '0.875rem',
                              color: 'text.secondary'
                            }}>
                              <Typography variant="caption" color="info.main" display="block" gutterBottom>
                                ✏️ Особые пожелания:
                              </Typography>
                              {item.specialInstructions}
                            </Box>
                          )}
                        </Paper>
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* Итоговая сумма */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3 
              }}>
                <Typography variant="h6" fontWeight={600}>
                  Итого:
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="700">
                  {totalAmount} ₽
                </Typography>
              </Box>
              
              {/* Кнопки действий */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={clearCart}
                  disabled={cartItems.length === 0 || createOrder.isPending}
                  color="error"
                  sx={{ borderRadius: 3, py: 1.5 }}
                >
                  Очистить корзину
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleSubmit}
                  disabled={
                    cartItems.length === 0 || 
                    !customerName.trim() || 
                    !phone.trim() || 
                    createOrder.isPending
                  }
                  startIcon={createOrder.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': { bgcolor: 'grey.400' }
                  }}
                >
                  {createOrder.isPending ? 'Создание...' : 'Создать заказ'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

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
    </Box>
  );
};

export default CreateOrderPage;