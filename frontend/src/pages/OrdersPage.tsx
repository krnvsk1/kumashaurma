import * as React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useOrders, useUpdateOrderStatus } from '../api/hooks';
import type { Order, OrderStatus } from '../types';

// Компонент для отображения статуса с цветом
const StatusChip: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Новый': return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Готовится': return { bg: '#fff3e0', color: '#f57c00' };
      case 'Готов': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Доставлен': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Отменён': return { bg: '#ffebee', color: '#d32f2f' };
      default: return { bg: '#f5f5f5', color: '#757575' };
    }
  };

  const { bg, color } = getStatusColor(status);

  return (
    <Chip
      label={status}
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 500,
        minWidth: 100
      }}
    />
  );
};

// Компонент одной карточки заказа
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: { status: newStatus }
      });
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
    setAnchorEl(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Верхняя часть с основной информацией */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h6" component="span">
                Заказ #{order.id}
              </Typography>
              <StatusChip status={order.status} />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Клиент: <strong>{order.customerName}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Телефон: <strong>{order.phone}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Адрес: <strong>{order.address || 'Самовывоз'}</strong>
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Создан: <strong>{formatDate(order.createdAt)}</strong>
                </Typography>
                {order.completedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Завершён: <strong>{formatDate(order.completedAt)}</strong>
                  </Typography>
                )}
                {order.notes && (
                  <Typography variant="body2" color="text.secondary">
                    Примечание: <strong>{order.notes}</strong>
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Правая часть с суммой и действиями */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
            <Typography variant="h5" color="#ef4444" fontWeight="bold" gutterBottom>
              {order.total} ₽
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                title={expanded ? "Скрыть состав" : "Показать состав"}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              
              <IconButton 
                size="small" 
                onClick={(e) => setAnchorEl(e.currentTarget)}
                title="Изменить статус"
                disabled={updateStatus.isPending}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Меню изменения статуса */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {['Новый', 'Готовится', 'Готов', 'Доставлен', 'Отменён'].map((status) => (
                <MenuItem 
                  key={status} 
                  onClick={() => handleStatusChange(status as OrderStatus)}
                  selected={order.status === status}
                >
                  {status}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {/* Состав заказа (раскрывающийся) */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Состав заказа:
            </Typography>
            <Paper variant="outlined" sx={{ bgcolor: '#fafafa' }}>
              <List dense>
                {order.orderItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} × ${item.price} ₽`}
                      />
                      <Typography variant="body2" fontWeight="500">
                        {item.subtotal} ₽
                      </Typography>
                    </ListItem>
                    {index < order.orderItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                <Divider />
                <ListItem>
                  <ListItemText primary="Итого" />
                  <Typography variant="subtitle1" fontWeight="bold" color="#ef4444">
                    {order.total} ₽
                  </Typography>
                </ListItem>
              </List>
            </Paper>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Основной компонент страницы
const OrdersPage: React.FC = () => {
  const { data: orders = [], isLoading, error, refetch } = useOrders();

  // Фильтры (можно добавить позже)
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | 'all'>('all');

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  // Статистика
  const stats = React.useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    const newCount = orders.filter(o => o.status === 'Новый').length;
    const preparingCount = orders.filter(o => o.status === 'Готовится').length;
    const readyCount = orders.filter(o => o.status === 'Готов').length;
    
    return { total, newCount, preparingCount, readyCount };
  }, [orders]);

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Повторить
          </Button>
        }
      >
        Ошибка загрузки заказов: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Заголовок и действия */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Заказы
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            component={Link}
            to="/order"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Новый заказ
          </Button>
        </Box>
      </Box>

      {/* Статистика */}
      {!isLoading && orders.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">Всего заказов</Typography>
            <Typography variant="h6">{orders.length}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: '#e3f2fd' }}>
            <Typography variant="body2" color="text.secondary">Новые</Typography>
            <Typography variant="h6" color="#1976d2">{stats.newCount}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: '#fff3e0' }}>
            <Typography variant="body2" color="text.secondary">Готовятся</Typography>
            <Typography variant="h6" color="#f57c00">{stats.preparingCount}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: '#e8f5e9' }}>
            <Typography variant="body2" color="text.secondary">Готовы</Typography>
            <Typography variant="h6" color="#2e7d32">{stats.readyCount}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">Выручка</Typography>
            <Typography variant="h6" color="#ef4444">{stats.total} ₽</Typography>
          </Paper>
        </Box>
      )}

      {/* Фильтры (простые кнопки) */}
      {!isLoading && orders.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label="Все"
            onClick={() => setStatusFilter('all')}
            color={statusFilter === 'all' ? 'primary' : 'default'}
          />
          {['Новый', 'Готовится', 'Готов', 'Доставлен', 'Отменён'].map(status => (
            <Chip
              key={status}
              label={status}
              onClick={() => setStatusFilter(status as OrderStatus)}
              color={statusFilter === status ? 'primary' : 'default'}
              variant={statusFilter === status ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      )}

      {/* Список заказов */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка заказов...</Typography>
        </Box>
      ) : filteredOrders.length > 0 ? (
        <Box>
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          {statusFilter === 'all' 
            ? 'Заказов пока нет. Создайте первый заказ!' 
            : `Нет заказов со статусом "${statusFilter}"`}
        </Alert>
      )}

      {/* Подвал с количеством */}
      {!isLoading && filteredOrders.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Показано {filteredOrders.length} из {orders.length} заказов
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrdersPage;