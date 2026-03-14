import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  ShoppingBag as OrdersIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProfileMenuProps {
  onLoginClick: () => void;
}

export default function ProfileMenu({ onLoginClick }: ProfileMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleMyOrders = () => {
    navigate('/orders');
    handleClose();
  };

  const handleAdminDashboard = () => {
    navigate('/admin/dashboard');
    handleClose();
  };

  // Не авторизован - показать кнопку входа
  if (!isAuthenticated || !user) {
    return (
      <IconButton
        onClick={onLoginClick}
        sx={{
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 0.75,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <PersonIcon sx={{ mr: 0.5 }} />
        <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
          Войти
        </Typography>
      </IconButton>
    );
  }

  // Авторизован - показать меню профиля
  const isAdmin = hasRole('admin') || hasRole('manager');
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : user.phone.slice(-2);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 0.75,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'primary.main',
            fontSize: '0.75rem',
            mr: 0.5,
          }}
        >
          {initials}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
          {user.firstName || user.phone}
        </Typography>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.phone}
          </Typography>
          {user.roles.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
              {user.roles.includes('admin') ? 'Администратор' :
               user.roles.includes('manager') ? 'Менеджер' :
               user.roles.includes('courier') ? 'Курьер' : 'Клиент'}
            </Typography>
          )}
        </Box>

        <Divider />

        <MenuItem onClick={handleMyOrders} sx={{ borderRadius: 1, mx: 0.5 }}>
          <ListItemIcon>
            <OrdersIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Мои заказы</ListItemText>
        </MenuItem>

        {isAdmin && (
          <MenuItem onClick={handleAdminDashboard} sx={{ borderRadius: 1, mx: 0.5 }}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Панель управления</ListItemText>
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, mx: 0.5, color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Выйти</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}