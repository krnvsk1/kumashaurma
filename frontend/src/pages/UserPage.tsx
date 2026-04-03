import * as React from 'react';
import {
  Typography, Box, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Alert, LinearProgress, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, Tooltip, Snackbar,
  useTheme, Avatar
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  LocalShipping as CourierIcon,
  SupervisorAccount as ManagerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useUsers, useAssignRole, useRemoveRole } from '../api/hooks';
import type { User, UserRole } from '../types';

// Конфигурация ролей
const ROLES_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  user: { label: 'Пользователь', color: '#6b7280', icon: <PersonIcon fontSize="small" /> },
  admin: { label: 'Администратор', color: '#dc2626', icon: <AdminIcon fontSize="small" /> },
  manager: { label: 'Менеджер', color: '#2563eb', icon: <ManagerIcon fontSize="small" /> },
  courier: { label: 'Курьер', color: '#16a34a', icon: <CourierIcon fontSize="small" /> },
};

const ALL_ROLES: UserRole[] = ['user', 'admin', 'manager', 'courier'];

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const [roleFilter, setRoleFilter] = React.useState<UserRole | ''>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [roleToAdd, setRoleToAdd] = React.useState<UserRole>('user');
  const [userForDialog, setUserForDialog] = React.useState<User | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { data: users = [], isLoading, error, refetch, isRefetching } = useUsers(
    roleFilter ? { role: roleFilter } : undefined
  );

  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  // Фильтрация по поиску
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.phone.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
  }, [users, searchQuery]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenRoleDialog = (role: UserRole) => {
    setRoleToAdd(role);
    setUserForDialog(selectedUser); // Сохраняем пользователя для диалога
    setRoleDialogOpen(true);
    handleMenuClose();
  };

  const handleAssignRole = async () => {
    if (!userForDialog) return;
    
    try {
      await assignRole.mutateAsync({ userId: userForDialog.id, role: { role: roleToAdd } });
      setSnackbar({
        open: true,
        message: `Роль "${ROLES_CONFIG[roleToAdd].label}" успешно назначена`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Ошибка при назначении роли',
        severity: 'error'
      });
    }
    setRoleDialogOpen(false);
    setUserForDialog(null);
  };

  const handleRemoveRole = async (role: string) => {
    if (!selectedUser) return;
    
    try {
      await removeRole.mutateAsync({ userId: selectedUser.id, role });
      setSnackbar({
        open: true,
        message: `Роль "${role}" успешно удалена`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении роли',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const getRoleChip = (role: string) => {
    const config = ROLES_CONFIG[role as UserRole] || ROLES_CONFIG.user;
    return (
      <Chip
        size="small"
        label={config.label}
        icon={config.icon as React.ReactElement}
        sx={{
          bgcolor: theme.palette.mode === 'light' ? `${config.color}20` : `${config.color}40`,
          color: config.color,
          fontWeight: 500,
          '& .MuiChip-icon': { color: config.color }
        }}
      />
    );
  };

  const getAvailableRolesToAdd = (user: User): UserRole[] => {
    return ALL_ROLES.filter(role => !user.roles.includes(role));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return user.phone.slice(-2);
  };

  const getFullName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return 'Без имени';
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка загрузки пользователей: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Управление пользователями
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Назначение и управление ролями пользователей
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          Обновить
        </Button>
      </Box>

      {/* Фильтры */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Поиск по имени или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 300, flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon fontSize="small" />
                  Фильтр по роли
                </Box>
              </InputLabel>
              <Select
                value={roleFilter}
                label="Фильтр по роли"
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              >
                <MenuItem value="">Все роли</MenuItem>
                {ALL_ROLES.map(role => (
                  <MenuItem key={role} value={role}>
                    {ROLES_CONFIG[role].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Найдено: {filteredUsers.length} пользователей
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Пользователь</TableCell>
                      <TableCell>Телефон</TableCell>
                      <TableCell>Роли</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Дата регистрации</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.mode === 'light' ? 'primary.light' : 'primary.dark',
                                color: 'primary.contrastText'
                              }}
                            >
                              {getInitials(user)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                {getFullName(user)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {user.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => getRoleChip(role))
                            ) : (
                              <Chip size="small" label="Нет ролей" color="default" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.phoneVerified ? 'Подтверждён' : 'Не подтверждён'}
                            color={user.phoneVerified ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(user.createdAt ?? '')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Управление ролями">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, user)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Пользователи не найдены
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Меню действий */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 220 }
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1 }}>
          {selectedUser ? `Действия для ${getFullName(selectedUser)}` : ''}
        </Typography>
        
        {selectedUser && getAvailableRolesToAdd(selectedUser).length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
              Добавить роль:
            </Typography>
            {getAvailableRolesToAdd(selectedUser).map((role) => (
              <MenuItem key={role} onClick={() => handleOpenRoleDialog(role)}>
                <ListItemIcon>
                  <AddIcon fontSize="small" sx={{ color: ROLES_CONFIG[role].color }} />
                </ListItemIcon>
                <ListItemText>
                  {ROLES_CONFIG[role].label}
                </ListItemText>
              </MenuItem>
            ))}
          </>
        )}

        {selectedUser && selectedUser.roles.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
              Удалить роль:
            </Typography>
            {selectedUser.roles.map((role) => (
              <MenuItem key={role} onClick={() => handleRemoveRole(role)}>
                <ListItemIcon>
                  <RemoveIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>
                  {ROLES_CONFIG[role as UserRole]?.label || role}
                </ListItemText>
              </MenuItem>
            ))}
          </>
        )}
      </Menu>

            {/* Диалог подтверждения добавления роли */}
            <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography>
            Добавить роль <strong>{ROLES_CONFIG[roleToAdd].label}</strong> пользователю{' '}
            <strong>{userForDialog ? getFullName(userForDialog) : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={assignRole.isPending}
          >
            {assignRole.isPending ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
