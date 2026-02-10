import * as React from 'react';
import {
  Typography, Box, Button, Card, CardContent,
  CircularProgress, Alert, Grid
} from '@mui/material';

interface Order {
  id: number;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  createdAt: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetch('http://localhost:5199/api/orders')
      .then(res => res.json())
      .then(data => {
        console.log('Orders loaded:', data);
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading orders:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка загрузки заказов: {error}
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Заказы
        </Typography>
        <Button variant="contained" component="a" href="/create">
          Новый заказ
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка заказов...</Typography>
        </Box>
      ) : orders.length > 0 ? (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Заказ #{order.id}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Клиент:</strong> {order.customerName}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Телефон:</strong> {order.phone}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Создан:</strong> {new Date(order.createdAt).toLocaleString('ru-RU')}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary" gutterBottom>
                        {order.total} ₽
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 
                            order.status === 'Новый' ? '#e3f2fd' :
                            order.status === 'В процессе' ? '#fff3e0' :
                            order.status === 'Выполнен' ? '#e8f5e9' : '#f5f5f5',
                          color: 
                            order.status === 'Новый' ? '#1976d2' :
                            order.status === 'В процессе' ? '#f57c00' :
                            order.status === 'Выполнен' ? '#2e7d32' : '#757575',
                        }}
                      >
                        {order.status}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          Заказов пока нет. Создайте первый заказ!
        </Alert>
      )}

      {!loading && orders.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Показано {orders.length} заказов
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrdersPage;
