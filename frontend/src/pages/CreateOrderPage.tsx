import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useShawarmas, useCreateOrder } from '../api/hooks';
import type { CreateOrderDto } from '../types';
import { useCartStore } from '../store/cartStore'; // 👈 импортируем корзину

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: shawarmas = [], isLoading, error: shawarmasError } = useShawarmas();
  const createOrder = useCreateOrder();

  // 👇 Получаем данные из корзины
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);

  const [selectedShawarmaId, setSelectedShawarmaId] = React.useState<number | ''>('');
  const [quantity, setQuantity] = React.useState(1);
  
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

  // Вычисляем итоговую сумму
  const totalAmount = React.useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Добавление товара из меню (если передан через state)
  const preselectedItem = location.state?.selectedItem;

  React.useEffect(() => {
    if (preselectedItem && shawarmas.length > 0) {
      const fullItem = shawarmas.find(s => s.id === preselectedItem.id);
      if (fullItem) {
        // Используем addItem из store (нужно добавить в store, если нет)
        // Пока просто покажем сообщение
        showSnackbar(`Товар "${fullItem.name}" нужно добавить через меню`, 'info');
      }
    }
  }, [preselectedItem, shawarmas]);

  // Добавление товара в корзину (локально, для новой позиции)
  const handleAddItem = () => {
    if (!selectedShawarmaId) {
      showSnackbar('Выберите блюдо', 'error');
      return;
    }

    const shawarma = shawarmas.find(s => s.id === selectedShawarmaId);
    if (!shawarma) return;

    // Используем addItem из store (нужно добавить)
    // Временно через console.log
    console.log('Нужно добавить товар в корзину:', shawarma);
    showSnackbar(`Функция добавления в корзину будет позже`, 'info');
  };

  // Очистка корзины
  const handleClearCart = () => {
    clearCart();
    showSnackbar('Корзина очищена', 'success');
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
      showSnackbar('Добавьте хотя бы один товар', 'error');
      return;
    }

    // Подготавливаем данные
    const orderData: CreateOrderDto = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim() || 'Самовывоз',
      notes: notes.trim() || null,
      items: cartItems.map(item => ({
        shawarmaId: item.id,
        quantity: item.quantity
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

  if (shawarmasError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки меню: {shawarmasError.message}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Оформление заказа
      </Typography>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        {/* Левая колонка */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Информация о клиенте */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
              />
              
              <TextField
                fullWidth
                label="Телефон *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                required
                disabled={createOrder.isPending}
              />
              
              <TextField
                fullWidth
                label="Адрес доставки"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                margin="normal"
                disabled={createOrder.isPending}
                helperText="Оставьте пустым для самовывоза"
              />
              
              <TextField
                fullWidth
                label="Примечания"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                disabled={createOrder.isPending}
                helperText="Например: без лука, позвонить заранее"
              />
            </CardContent>
          </Card>
          
          {/* Добавление товара (опционально, можно убрать) */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Добавить ещё товар
              </Typography>
              
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 2 }}>Загрузка меню...</Typography>
                </Box>
              ) : shawarmas.length === 0 ? (
                <Alert severity="info">
                  Меню пусто. Сначала добавьте товары в меню.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Блюдо</InputLabel>
                    <Select
                      value={selectedShawarmaId}
                      label="Блюдо"
                      onChange={(e) => setSelectedShawarmaId(e.target.value as number)}
                      disabled={createOrder.isPending}
                    >
                      {shawarmas
                        .filter(item => item.isAvailable)
                        .map(item => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name} - {item.price} ₽
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Количество"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                    disabled={createOrder.isPending}
                    sx={{ minWidth: 100 }}
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={!selectedShawarmaId || createOrder.isPending}
                    sx={{ 
                      minWidth: 120,
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Добавить
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        {/* Правая колонка - корзина из store */}
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Состав заказа {cartItems.length > 0 && `(${cartItems.length} позиций)`}
              </Typography>
              
              {cartItems.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Корзина пуста. Добавьте товары из меню.
                </Typography>
              ) : (
                <List>
                  {cartItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={() => removeItem(item.id)}
                            disabled={createOrder.isPending}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(
                                  item.id, 
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )}
                                inputProps={{ min: 1, style: { width: 60 } }}
                                size="small"
                                disabled={createOrder.isPending}
                                sx={{ mr: 1 }}
                              />
                              <span>× {item.price} ₽ = {item.price * item.quantity} ₽</span>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Итого:
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {totalAmount} ₽
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleClearCart}
                  disabled={cartItems.length === 0 || createOrder.isPending}
                  color="error"
                >
                  Очистить
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateOrderPage;