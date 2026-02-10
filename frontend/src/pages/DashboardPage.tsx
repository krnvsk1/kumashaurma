import * as React from 'react';
import { 
  Typography, Box, Button, Card, CardContent, 
  Grid, CircularProgress, Alert
} from '@mui/material';
import { 
  Restaurant as RestaurantIcon,
  LocalShipping as DeliveryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  const [shawarmas, setShawarmas] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:5199/api/shawarma').then(res => res.json()),
      fetch('http://localhost:5199/api/orders').then(res => res.json())
    ])
    .then(([shawarmaData, orderData]) => {
      console.log('Dashboard data loaded:', { shawarmas: shawarmaData.length, orders: orderData.length });
      setShawarmas(shawarmaData);
      setOrders(orderData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const totalShawarmas = shawarmas.length;
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === 'Новый' || o.status === 'В процессе').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const stats = [
    { 
      title: 'Всего позиций', 
      value: totalShawarmas, 
      icon: <RestaurantIcon />, 
      color: '#1976d2'
    },
    { 
      title: 'Активные заказы', 
      value: activeOrders, 
      icon: <DeliveryIcon />, 
      color: '#ed6c02'
    },
    { 
      title: 'Всего заказов', 
      value: totalOrders, 
      icon: <CartIcon />, 
      color: '#9c27b0'
    },
    { 
      title: 'Выручка', 
      value: `${totalRevenue.toLocaleString('ru-RU')} ₽`, 
      icon: <MoneyIcon />, 
      color: '#2e7d32'
    },
  ];

  const recentOrders = orders.slice(0, 5);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка загрузки данных: {error}
        <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Панель управления Kumashaurma
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Обзор вашего бизнеса шаурмы
      </Typography>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {stat.title === 'Выручка' ? 'За всё время' : 'Текущее количество'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Последние заказы */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Последние заказы
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : recentOrders.length > 0 ? (
            <Grid container spacing={2}>
              {recentOrders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1">
                            #{order.id} - {order.customerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(order.createdAt).toLocaleString('ru-RU')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" color="primary">
                            {order.total} ₽
                          </Typography>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1,
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
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Заказов пока нет
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" href="/create">
          Создать новый заказ
        </Button>
        <Button variant="outlined" href="/orders">
          Просмотреть все заказы
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardPage;
