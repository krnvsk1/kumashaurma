import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  ThemeProvider, createTheme, CssBaseline, Badge,
  IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, useMediaQuery
} from '@mui/material';
import { 
  LocalDining as RestaurantIcon, 
  ShoppingCart, 
  Schedule,
  Dashboard as DashboardIcon,
  AddCircle as AddIcon,
  Menu as MenuIcon,           // 👈 Новая иконка для бургера
  Close as CloseIcon,          // 👈 Иконка закрытия
  Home as HomeIcon,
  ListAlt as ListAltIcon,
  AddShoppingCart as AddCartIcon
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Страницы
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import MenuPage from './pages/MenuPage';
import CreateMenuItemPage from "./pages/CreateMenuItemPage";

// Создаем QueryClient для React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Создаем тему в стиле kumashaurma
const theme = createTheme({
  palette: {
    primary: {
      main: '#ef4444',
    },
    secondary: {
      main: '#fbbf24',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif'
    ].join(','),
    h6: {
      fontWeight: 700,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

function App() {
  // Временное значение для корзины
  const cartTotal = 0;
  
  // Состояние для мобильного меню
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Определяем, мобильное ли устройство
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Функции для открытия/закрытия меню
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Элементы меню для мобильной версии
  const menuItems = [
    { text: 'Меню', icon: <HomeIcon />, path: '/' },
    { text: 'Заказы', icon: <ListAltIcon />, path: '/orders' },
    { text: 'Новый заказ', icon: <AddCartIcon />, path: '/order', highlight: true },
    { text: 'Дашборд', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Добавить товар', icon: <AddIcon />, path: '/admin/create' },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Шапка */}
            <AppBar 
              position="static" 
              sx={{ 
                bgcolor: '#0E1C28', 
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Toolbar>
                {/* Бургер-меню для мобильных */}
                {isMobile && (
                  <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={toggleMobileMenu}
                    sx={{ mr: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                {/* Логотип */}
                <Typography 
                  variant="h5" 
                  component={Link} 
                  to="/"
                  sx={{ 
                    fontWeight: 700, 
                    color: 'white',
                    flexGrow: 1,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1.1rem', sm: '1.5rem' } // Адаптивный размер
                  }}
                >
                  <RestaurantIcon sx={{ color: '#ef4444', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    КУМА ШАУРМА
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    КУМА
                  </Box>
                </Typography>
                
                {/* Время работы (скрыто на мобильных) */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, gap: 1 }}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    10:00−21:55
                  </Typography>
                </Box>

                {/* Корзина (всегда видна) */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, md: 3 } }}>
                  <Badge badgeContent={0} color="primary">
                    <ShoppingCart />
                  </Badge>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      ml: 1,
                      display: { xs: 'none', sm: 'block' } // Скрываем сумму на очень маленьких
                    }}
                  >
                    {cartTotal} ₽
                  </Typography>
                </Box>

                {/* Десктопная навигация */}
                {!isMobile && (
                  <>
                    {/* Публичная навигация */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button component={Link} to="/" sx={{ color: 'white' }}>
                        Меню
                      </Button>
                      <Button component={Link} to="/orders" sx={{ color: 'white' }}>
                        Заказы
                      </Button>
                      <Button 
                        component={Link} 
                        to="/order"
                        variant="contained"
                        sx={{ 
                          bgcolor: '#ef4444',
                          '&:hover': { bgcolor: '#dc2626' },
                          ml: 1
                        }}
                      >
                        Новый заказ
                      </Button>
                    </Box>

                    {/* Админ-меню */}
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button 
                        component={Link} 
                        to="/admin/dashboard"
                        startIcon={<DashboardIcon />}
                        sx={{ color: 'white' }}
                      >
                        Дашборд
                      </Button>
                      <Button 
                        component={Link} 
                        to="/admin/create"
                        startIcon={<AddIcon />}
                        sx={{ color: 'white' }}
                      >
                        Добавить
                      </Button>
                    </Box>
                  </>
                )}
              </Toolbar>
            </AppBar>

            {/* Мобильное меню (Drawer) */}
            <Drawer
              anchor="left"
              open={mobileMenuOpen}
              onClose={closeMobileMenu}
              sx={{
                '& .MuiDrawer-paper': {
                  width: 280,
                  bgcolor: '#0E1C28',
                  color: 'white',
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                {/* Заголовок меню с кнопкой закрытия */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantIcon sx={{ color: '#ef4444' }} />
                    Меню
                  </Typography>
                  <IconButton onClick={closeMobileMenu} sx={{ color: 'white' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                {/* Список пунктов меню */}
                <List>
                  {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        onClick={closeMobileMenu}
                        sx={{
                          borderRadius: 1,
                          bgcolor: item.highlight ? '#ef4444' : 'transparent',
                          '&:hover': {
                            bgcolor: item.highlight ? '#dc2626' : 'rgba(255,255,255,0.1)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            fontWeight: item.highlight ? 700 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />

                {/* Время работы в мобильном меню */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.7)', p: 1 }}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    Время работы: 10:00−21:55
                  </Typography>
                </Box>
              </Box>
            </Drawer>
            
            {/* Основной контент */}
            <Container 
              maxWidth="lg" 
              sx={{ 
                mt: { xs: 2, sm: 4 }, 
                mb: { xs: 2, sm: 4 }, 
                flex: 1,
                px: { xs: 1, sm: 2, md: 3 } // Адаптивные отступы
              }}
            >
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/order" element={<CreateOrderPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/create" element={<CreateMenuItemPage />} />
                <Route path="/admin/edit/:id" element={<CreateMenuItemPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
            
            {/* Футер */}
            <Box 
              component="footer" 
              sx={{ 
                py: { xs: 2, sm: 3 }, 
                px: 2, 
                mt: 'auto', 
                backgroundColor: '#0E1C28',
                color: 'white',
                borderTop: '1px solid #1e293b',
              }}
            >
              <Container maxWidth="lg">
                <Typography variant="body2" align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  © {new Date().getFullYear()} Кума Шаурма. Все права защищены.
                </Typography>
              </Container>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
export default App;