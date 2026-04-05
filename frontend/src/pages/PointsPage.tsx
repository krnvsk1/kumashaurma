import * as React from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  Star as StarIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CardGiftcard as GiftIcon,
  AdminPanelSettings as AdminIcon,
  Schedule as ExpiredIcon,
  ShoppingBag as ShoppingIcon,
} from '@mui/icons-material';
import { usePointsBalance, usePointsHistory } from '../api/hooks';
import { useAuthStore } from '../store/authStore';
import type { PointsTransaction } from '../types';

const getTransactionTypeConfig = (
  type: PointsTransaction['type'],
  themeMode: 'light' | 'dark'
) => {
  switch (type) {
    case 'earned':
      return {
        icon: <ShoppingIcon fontSize="small" />,
        color: '#2e7d32',
        bg: themeMode === 'light' ? '#e8f5e9' : '#1b5e2040',
        label: 'Начислено',
      };
    case 'spent':
      return {
        icon: <RemoveIcon fontSize="small" />,
        color: '#d32f2f',
        bg: themeMode === 'light' ? '#ffebee' : '#b71c1c40',
        label: 'Списано',
      };
    case 'admin_grant':
      return {
        icon: <AdminIcon fontSize="small" />,
        color: '#1565c0',
        bg: themeMode === 'light' ? '#e3f2fd' : '#0d47a140',
        label: 'Начислено админом',
      };
    case 'admin_deduct':
      return {
        icon: <AdminIcon fontSize="small" />,
        color: '#e65100',
        bg: themeMode === 'light' ? '#fff3e0' : '#bf360c40',
        label: 'Списано админом',
      };
    case 'expired':
      return {
        icon: <ExpiredIcon fontSize="small" />,
        color: '#616161',
        bg: themeMode === 'light' ? '#f5f5f5' : '#42424240',
        label: 'Истекло',
      };
    default:
      return {
        icon: <StarIcon fontSize="small" />,
        color: themeMode === 'light' ? '#616161' : '#9e9e9e',
        bg: 'transparent',
        label: type,
      };
  }
};

const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const PointsPage: React.FC = () => {
  const theme = useTheme();
  const themeMode = theme.palette.mode;
  const { isAuthenticated } = useAuthStore();

  const { data: balanceData, isLoading: balanceLoading } = usePointsBalance();
  const { data: transactionsData, isLoading: historyLoading } = usePointsHistory(1, 50);
  const transactions = Array.isArray(transactionsData) ? transactionsData : [];

  const balance = balanceData?.balance ?? 0;

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { date: string; items: PointsTransaction[] }[] = [];
    const dateMap = new Map<string, PointsTransaction[]>();

    transactions.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(tx);
    });

    dateMap.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups;
  }, [transactions]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Войдите, чтобы увидеть баллы
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Авторизуйтесь для доступа к программе лояльности
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Мои баллы
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Копите баллы и оплачивайте ими заказы
      </Typography>

      {/* Balance Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: themeMode === 'light'
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            : 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: themeMode === 'light'
                ? 'rgba(245,158,11,0.2)'
                : 'rgba(245,158,11,0.15)',
            }}
          >
            <StarIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
          </Box>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Ваш баланс
            </Typography>
            {balanceLoading ? (
              <Skeleton width={120} height={40} />
            ) : (
              <Typography
                variant="h3"
                component="span"
                sx={{
                  fontWeight: 800,
                  color: themeMode === 'light' ? '#92400e' : '#fbbf24',
                }}
              >
                {balance}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                color: themeMode === 'light' ? '#92400e' : '#fbbf24',
                opacity: 0.8,
              }}
            >
              {' '}
              баллов
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            mt: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: themeMode === 'light'
              ? 'rgba(255,255,255,0.6)'
              : 'rgba(255,255,255,0.05)',
          }}
        >
          <Chip
            icon={<GiftIcon />}
            label="1 балл = 1 ₽"
            size="small"
            sx={{
              bgcolor: themeMode === 'light'
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(245,158,11,0.1)',
              fontWeight: 500,
            }}
          />
          <Chip
            label="1 балл за каждые 100 ₽"
            size="small"
            variant="outlined"
            sx={{
              borderColor: themeMode === 'light'
                ? 'rgba(245,158,11,0.3)'
                : 'rgba(245,158,11,0.2)',
              fontWeight: 500,
            }}
          />
        </Box>
      </Paper>

      {/* Transaction History */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        История операций
      </Typography>

      {historyLoading ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            p: 2,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="30%" height={14} />
              </Box>
              <Skeleton width={60} height={24} />
            </Box>
          ))}
        </Paper>
      ) : groupedTransactions.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            p: 4,
            textAlign: 'center',
          }}
        >
          <StarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Пока нет операций
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Баллы начнут начисляться с вашего первого заказа
          </Typography>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          {groupedTransactions.map((group, groupIdx) => {
            const config = getTransactionTypeConfig;
            return (
              <Box key={group.date}>
                {groupIdx > 0 && <Divider />}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor:
                      themeMode === 'light'
                        ? 'rgba(0,0,0,0.02)'
                        : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    {group.date}
                  </Typography>
                </Box>
                <List disablePadding>
                  {group.items.map((tx, txIdx) => {
                    const typeConfig = getTransactionTypeConfig(tx.type, themeMode);
                    const isPositive = tx.amount > 0;
                    return (
                      <React.Fragment key={tx.id}>
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1.5,
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 40,
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: typeConfig.bg,
                              color: typeConfig.color,
                            }}
                          >
                            {typeConfig.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography variant="body2" fontWeight={500}>
                                  {tx.description || typeConfig.label}
                                </Typography>
                                {tx.orderId && (
                                  <Chip
                                    label={`#${tx.orderId}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      borderColor: theme.palette.divider,
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatTransactionDate(tx.createdAt)}
                              </Typography>
                            }
                          />
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{
                              color: isPositive ? '#2e7d32' : '#d32f2f',
                              whiteSpace: 'nowrap',
                              ml: 1,
                            }}
                          >
                            {isPositive ? '+' : ''}
                            {tx.amount} ₽
                          </Typography>
                        </ListItem>
                        {txIdx < group.items.length - 1 && (
                          <Divider
                            variant="inset"
                            component="li"
                            sx={{ ml: 6 }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
};

export default PointsPage;
