import * as React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  FormControl,
  InputLabel,
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

// Интерфейсы для типов
interface ShawarmaItem {
  id: number;
  name: string;
  price: number;
}

interface OrderItem {
  shawarmaId: number;
  name: string;
  quantity: number;
  price: number;
}

const CreateOrderPage: React.FC = () => {
  const [shawarmas, setShawarmas] = React.useState<ShawarmaItem[]>([]);
  const [selectedShawarma, setSelectedShawarma] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  React.useEffect(() => {
    fetch('http://localhost:5199/api/shawarma')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Меню загружено:', data);
        setShawarmas(data);
        if (data.length > 0) {
          setSelectedShawarma(data[0].id.toString());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Ошибка загрузки меню:', err);
        showSnackbar('Ошибка загрузки меню', 'error');
        setLoading(false);
      });
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddItem = () => {
    const shawarma = shawarmas.find(s => s.id === parseInt(selectedShawarma));
    if (shawarma) {
      const newItem: OrderItem = {
        shawarmaId: shawarma.id,
        name: shawarma.name,
        quantity: quantity,
        price: shawarma.price
      };
      setOrderItems([...orderItems, newItem]);
      setQuantity(1);
      console.log('🛒 Добавлен товар:', newItem);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    const removed = newItems.splice(index, 1);
    setOrderItems(newItems);
    console.log('🗑️ Удален товар:', removed[0]);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
    if (orderItems.length === 0) {
      showSnackbar('Добавьте хотя бы один товар', 'error');
      return;
    }

    // Подготовка данных
    const orderData = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      total: totalAmount,
      items: orderItems
    };

    console.log('📤 Отправка заказа на сервер:', orderData);
    console.log('📄 JSON:', JSON.stringify(orderData));

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5199/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      console.log('📨 Ответ сервера:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        
        try {
          const responseClone = response.clone();
          const errorData = await responseClone.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Данные ошибки:', errorData);
        } catch {
          try {
            const responseClone = response.clone();
            const errorText = await responseClone.text();
            console.error('❌ Текст ошибки:', errorText);
            errorMessage = errorText || errorMessage;
          } catch {
            // Оставляем стандартное сообщение
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Заказ создан успешно:', data);

      // Показываем успех
      showSnackbar(`Заказ #${data.id} создан успешно!`, 'success');
      
      // Сброс формы
      setTimeout(() => {
        setCustomerName('');
        setPhone('');
        setAddress('');
        setNotes('');
        setOrderItems([]);
        setQuantity(1);
        if (shawarmas.length > 0) {
          setSelectedShawarma(shawarmas[0].id.toString());
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Ошибка при создании заказа:', err);
      showSnackbar(`Ошибка: ${err.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Создание нового заказа
      </Typography>

      {/* Упрощенная версия без Grid - используем CSS Grid напрямую */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        {/* Левая колонка */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                disabled={submitting}
                helperText="Обязательное поле"
              />
              
              <TextField
                fullWidth
                label="Телефон *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                required
                disabled={submitting}
                helperText="Обязательное поле"
              />
              
              <TextField
                fullWidth
                label="Адрес доставки"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                margin="normal"
                disabled={submitting}
                helperText="Необязательное поле"
              />
              
              <TextField
                fullWidth
                label="Примечания"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                disabled={submitting}
                helperText="Например: без лука, позвонить заранее"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Добавить блюдо
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 2 }}>Загрузка меню...</Typography>
                </Box>
              ) : shawarmas.length === 0 ? (
                <Alert severity="warning">
                  Меню не загружено. Проверьте подключение к серверу.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Блюдо</InputLabel>
                    <Select
                      value={selectedShawarma}
                      label="Блюдо"
                      onChange={(e) => setSelectedShawarma(e.target.value)}
                      disabled={submitting}
                      native
                    >
                      {shawarmas.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.price} ₽
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Количество"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                    disabled={submitting}
                    sx={{ minWidth: 100 }}
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={!selectedShawarma || submitting}
                    sx={{ minWidth: 120 }}
                  >
                    Добавить
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        {/* Правая колонка */}
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Состав заказа {orderItems.length > 0 && `(${orderItems.length} позиций)`}
              </Typography>
              
              {orderItems.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Добавьте блюда в заказ
                </Typography>
              ) : (
                <List>
                  {orderItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            onClick={() => handleRemoveItem(index)}
                            disabled={submitting}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.quantity} × ${item.price} ₽ = ${item.quantity * item.price} ₽`}
                        />
                      </ListItem>
                      {index < orderItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Итого:
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {totalAmount} ₽
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setOrderItems([]);
                    console.log('🧹 Корзина очищена');
                  }}
                  disabled={orderItems.length === 0 || submitting}
                >
                  Очистить
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleSubmit}
                  disabled={orderItems.length === 0 || !customerName || !phone || submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {submitting ? 'Создание...' : 'Создать заказ'}
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                * Обязательные поля. После создания заказа форма очистится автоматически.
              </Typography>
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