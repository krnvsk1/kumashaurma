import * as React from 'react';
import { 
  Typography, Box, Button, Card, CardContent, 
  Grid, Alert, Paper,
  LinearProgress, Chip
} from '@mui/material';
import { 
  Restaurant as RestaurantIcon,
  LocalShipping as DeliveryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useShawarmas } from '../api/hooks';
import { useOrders } from '../api/hooks';
import type { Order, Shawarma } from '../types';

// Компонент для карточки статистики
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}> = ({ title, value, icon, color, subtitle, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      {loading ? (
        <Box sx={{ py: 2 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Компонент для строки заказа в списке последних
const RecentOrderRow: React.FC<{ order: Order }> = ({ order }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новый': return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Готовится': return { bg: '#fff3e0', color: '#f57c00' };
      case 'Готов': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Доставлен': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Отменён': return { bg: '#ffebee', color: '#d32f2f' };
      default: return { bg: '#f5f5f5', color: '#757575' };
    }
  };

  const { bg, color } = getStatusColor(order.status);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Заказ #{order.id} • {order.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(order.createdAt).toLocaleString('ru-RU')}
          </Typography>
          {order.orderItems && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {order.orderItems.map(item => item.name).join(', ')}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="#ef4444" fontWeight="bold">
            {order.total} ₽
          </Typography>
          <Chip
            label={order.status}
            sx={{
              bgcolor: bg,
              color: color,
              fontWeight: 500,
              minWidth: 90
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

// Компонент для популярных товаров
const PopularItems: React.FC<{ orders: Order[]; shawarmas: Shawarma[] }> = ({ orders, shawarmas }) => {
  // Считаем статистику по товарам
  const itemStats = React.useMemo(() => {
    const stats = new Map<number, { name: string; quantity: number; revenue: number }>();
    
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const current = stats.get(item.shawarmaId) || {
          name: item.name,
          quantity: 0,
          revenue: 0
        };
        stats.set(item.shawarmaId, {
          name: item.name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.subtotal
        });
      });
    });

    return Array.from(stats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Топ-5
  }, [orders]);

  if (itemStats.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
        Нет данных о продажах
      </Typography>
    );
  }

  const maxQuantity = Math.max(...itemStats.map(item => item.quantity));

  return (
    <Box>
      {itemStats.map((item, index) => (
        <Box key={item.id} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">
              {index + 1}. {item.name}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {item.quantity} шт. • {item.revenue} ₽
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(item.quantity / maxQuantity) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#ffe5e5',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#ef4444'
              }
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

const DashboardPage: React.FC = () => {
  // Используем наши хуки!
  const { 
    data: shawarmas = [], 
    isLoading: shawarmasLoading, 
    error: shawarmasError,
    refetch: refetchShawarmas 
  } = useShawarmas();
  
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders 
  } = useOrders();

  const [refreshing, setRefreshing] = React.useState(false);

  // Функция для ручного обновления
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchShawarmas(), refetchOrders()]);
    setRefreshing(false);
  };

  const loading = shawarmasLoading || ordersLoading || refreshing;
  const error = shawarmasError || ordersError;

  // Вычисляем статистику
  const stats = React.useMemo(() => {
    const totalShawarmas = shawarmas.length;
    const availableShawarmas = shawarmas.filter(s => s.isAvailable).length;
    
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => 
      o.status === 'Новый' || o.status === 'Готовится'
    ).length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Заказы за сегодня
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => 
      new Date(o.createdAt).toDateString() === today
    );
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      totalShawarmas,
      availableShawarmas,
      totalOrders,
      activeOrders,
      totalRevenue,
      todayOrders: todayOrders.length,
      todayRevenue
    };
  }, [shawarmas, orders]);

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Повторить
          </Button>
        }
      >
        Ошибка загрузки данных: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Заголовок с кнопкой обновления */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Панель управления
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Обзор вашего бизнеса шаурмы
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Обновить
        </Button>
      </Box>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="В меню"
            value={`${stats.availableShawarmas}/${stats.totalShawarmas}`}
            icon={<RestaurantIcon />}
            color="#1976d2"
            subtitle="Доступно / Всего"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Активные заказы"
            value={stats.activeOrders}
            icon={<DeliveryIcon />}
            color="#ed6c02"
            subtitle="В работе"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Заказов сегодня"
            value={stats.todayOrders}
            icon={<ScheduleIcon />}
            color="#9c27b0"
            subtitle={`На сумму ${stats.todayRevenue.toLocaleString('ru-RU')} ₽`}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Выручка"
            value={`${stats.totalRevenue.toLocaleString('ru-RU')} ₽`}
            icon={<MoneyIcon />}
            color="#2e7d32"
            subtitle="За всё время"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Два блока в ряд */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Последние заказы */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CartIcon sx={{ color: '#ef4444' }} />
                <Typography variant="h6">
                  Последние заказы
                </Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress />
                </Box>
              ) : recentOrders.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentOrders.map((order) => (
                    <RecentOrderRow key={order.id} order={order} />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Заказов пока нет
                </Typography>
              )}

              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button component={Link} to="/orders" color="inherit">
                  Все заказы →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Популярные товары */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#ef4444' }} />
                <Typography variant="h6">
                  Популярные товары
                </Typography>
              </Box>
              
              {loading ? (
                <Box sx={{ py: 4 }}>
                  <LinearProgress />
                </Box>
              ) : orders.length > 0 ? (
                <PopularItems orders={orders} shawarmas={shawarmas} />
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Нет данных о продажах
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Быстрые действия */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          component={Link}
          to="/order"
          sx={{
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: '#dc2626' }
          }}
        >
          Создать новый заказ
        </Button>
        <Button
          variant="outlined"
          component={Link}
          to="/orders"
          color="inherit"
        >
          Просмотреть все заказы
        </Button>
        <Button
          variant="outlined"
          component={Link}
          to="/admin/create"
          color="inherit"
        >
          Добавить товар
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardPage;