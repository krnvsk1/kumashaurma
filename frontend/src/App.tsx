import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  ThemeProvider, createTheme, CssBaseline, Badge
} from '@mui/material';
import { 
  LocalDining as RestaurantIcon, 
  ShoppingCart, 
  Schedule,
  Dashboard as DashboardIcon,
  AddCircle as AddIcon
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      main: '#ef4444', // Красный как на сайте
    },
    secondary: {
      main: '#fbbf24', // Желтый для акцентов
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
});

function App() {
  // Временное значение для корзины (потом заменим на Zustand)
  const cartTotal = 0; // TODO: заменить на useCartStore

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
                  }}
                >
                  <RestaurantIcon sx={{ color: '#ef4444' }} />
                  КУМА ШАУРМА
                </Typography>
                
                {/* Время работы */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, gap: 1 }}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    10:00−21:55
                  </Typography>
                </Box>

                {/* Корзина (заглушка) */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                  <Badge badgeContent={0} color="primary">
                    <ShoppingCart />
                  </Badge>
                  <Typography variant="body2" sx={{ fontWeight: 500, ml: 1 }}>
                    {cartTotal} ₽
                  </Typography>
                </Box>

                {/* Навигация - публичная */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                  <Button 
                    component={Link} 
                    to="/" 
                    sx={{ color: 'white' }}
                  >
                    Меню
                  </Button>
                  <Button 
                    component={Link} 
                    to="/orders"
                    sx={{ color: 'white' }}
                  >
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

                {/* Админ-меню (можно показывать по ролям) */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 2 }}>
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
              </Toolbar>
            </AppBar>
            
            {/* Основной контент */}
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Routes>
                {/* Публичные маршруты */}
                <Route path="/" element={<MenuPage />} />
                <Route path="/order" element={<CreateOrderPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                
                {/* Админ-маршруты */}
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/create" element={<CreateMenuItemPage />} />
                <Route path="/admin/edit/:id" element={<CreateMenuItemPage />} />
                
                {/* Редирект на главную для неизвестных путей */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
            
            {/* Футер */}
            <Box 
              component="footer" 
              sx={{ 
                py: 3, 
                px: 2, 
                mt: 'auto', 
                backgroundColor: '#0E1C28',
                color: 'white',
                borderTop: '1px solid #1e293b',
              }}
            >
              <Container maxWidth="lg">
                <Typography variant="body2" align="center">
                  © {new Date().getFullYear()} Кума Шаурма. Все права защищены.
                </Typography>
              </Container>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;