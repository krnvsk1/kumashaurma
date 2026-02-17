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
  Paper,
  TextField,
  InputAdornment,
  useTheme  // 👈 Добавлено
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useOrders, useUpdateOrderStatus } from '../api/hooks';
import type { Order, OrderStatus } from '../types';

// Компонент для отображения статуса с цветом
const StatusChip: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const theme = useTheme();
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Новый': return { 
        bg: theme.palette.mode === 'light' ? '#e3f2fd' : '#1e3a5f', 
        color: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9' 
      };
      case 'Готовится': return { 
        bg: theme.palette.mode === 'light' ? '#fff3e0' : '#663c00', 
        color: theme.palette.mode === 'light' ? '#f57c00' : '#ffb74d' 
      };
      case 'Готов': return { 
        bg: theme.palette.mode === 'light' ? '#e8f5e9' : '#1b5e20', 
        color: theme.palette.mode === 'light' ? '#2e7d32' : '#81c784' 
      };
      case 'Доставлен': return { 
        bg: theme.palette.mode === 'light' ? '#e8f5e9' : '#1b5e20', 
        color: theme.palette.mode === 'light' ? '#2e7d32' : '#81c784' 
      };
      case 'Отменён': return { 
        bg: theme.palette.mode === 'light' ? '#ffebee' : '#7f1d1d', 
        color: theme.palette.mode === 'light' ? '#d32f2f' : '#ef5350' 
      };
      default: return { 
        bg: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242', 
        color: theme.palette.mode === 'light' ? '#757575' : '#bdbdbd' 
      };
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
  const theme = useTheme();
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

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                color: 'primary.main',
                fontWeight: 'bold'
              }}
            >
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

        <Collapse in={expanded}>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Состав заказа:
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#1e293b'
              }}
            >
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
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    sx={{ color: 'primary.main' }}
                  >
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
  const theme = useTheme();
  const { data: orders = [], isLoading, error, refetch } = useOrders();

  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | 'all'>('all');
  const [searchId, setSearchId] = React.useState('');
  const [searchName, setSearchName] = React.useState('');
  const [searchPhone, setSearchPhone] = React.useState('');

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchId && !order.id.toString().includes(searchId)) return false;
      if (searchName && !order.customerName.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (searchPhone && !order.phone.includes(searchPhone)) return false;
      return true;
    });
  }, [orders, statusFilter, searchId, searchName, searchPhone]);

  const stats = React.useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    const newCount = orders.filter(o => o.status === 'Новый').length;
    const preparingCount = orders.filter(o => o.status === 'Готовится').length;
    const readyCount = orders.filter(o => o.status === 'Готов').length;
    return { total, newCount, preparingCount, readyCount };
  }, [orders]);

  const handleClearSearch = () => {
    setSearchId('');
    setSearchName('');
    setSearchPhone('');
  };

  const isSearchActive = searchId || searchName || searchPhone;

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
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Новый заказ
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Поиск по номеру"
              placeholder="Например: 123"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NumbersIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Поиск по имени"
              placeholder="Имя клиента"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Поиск по телефону"
              placeholder="+7..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearSearch}
              disabled={!isSearchActive}
              sx={{ height: '40px' }}
            >
              Сбросить фильтры
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {!isLoading && orders.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">Всего заказов</Typography>
            <Typography variant="h6">{orders.length}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: theme.palette.mode === 'light' ? '#e3f2fd' : '#1e3a5f' }}>
            <Typography variant="body2" color="text.secondary">Новые</Typography>
            <Typography variant="h6" sx={{ color: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9' }}>
              {stats.newCount}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: theme.palette.mode === 'light' ? '#fff3e0' : '#663c00' }}>
            <Typography variant="body2" color="text.secondary">Готовятся</Typography>
            <Typography variant="h6" sx={{ color: theme.palette.mode === 'light' ? '#f57c00' : '#ffb74d' }}>
              {stats.preparingCount}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120, bgcolor: theme.palette.mode === 'light' ? '#e8f5e9' : '#1b5e20' }}>
            <Typography variant="body2" color="text.secondary">Готовы</Typography>
            <Typography variant="h6" sx={{ color: theme.palette.mode === 'light' ? '#2e7d32' : '#81c784' }}>
              {stats.readyCount}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">Выручка</Typography>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              {stats.total} ₽
            </Typography>
          </Paper>
        </Box>
      )}

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

      {isSearchActive && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Найдено заказов: {filteredOrders.length}
          </Typography>
          {filteredOrders.length === 0 && (
            <Button size="small" onClick={handleClearSearch}>
              Сбросить поиск
            </Button>
          )}
        </Box>
      )}

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
          {isSearchActive 
            ? 'Ничего не найдено по заданным критериям' 
            : statusFilter !== 'all' 
              ? `Нет заказов со статусом "${statusFilter}"`
              : 'Заказов пока нет. Создайте первый заказ!'}
        </Alert>
      )}

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