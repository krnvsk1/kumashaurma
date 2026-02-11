import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  ThemeProvider, createTheme, CssBaseline 
} from '@mui/material';
import { LocalDining as RestaurantIcon, ShoppingCart, Schedule } from '@mui/icons-material';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import MenuPage from './pages/MenuPage'; // Исправил импорт - это страница, а не компонент

// Создаем тему в стиле kumashaurma.ru
const theme = createTheme({
  palette: {
    primary: {
      main: '#dc2626', // Красный как на сайте
    },
    secondary: {
      main: '#fbbf24', // Желтый для акцентов
    },
    background: {
      default: '#fefce8', // Светло-желтый фон
    },
    text: {
      primary: '#1f2937', // Темно-серый текст
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
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Шапка в стиле kumashaurma.ru */}
          <AppBar 
            position="static" 
            sx={{ 
              bgcolor: 'white', 
              color: 'text.primary',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
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
                  color: '#dc2626',
                  flexGrow: 1,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <RestaurantIcon sx={{ color: '#dc2626' }} />
                КУМА ШАУРМА
              </Typography>
              
              {/* Время работы */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, gap: 1 }}>
                <Schedule fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  10:00−21:55
                </Typography>
              </Box>

              {/* Корзина */}
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <ShoppingCart sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  0 ₽
                </Typography>
              </Box>

              {/* Навигация */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <Button 
                  component={Link} 
                  to="/" 
                  sx={{ 
                    color: '#1f2937',
                    fontWeight: 500,
                    '&:hover': { color: '#dc2626' }
                  }}
                >
                  Меню
                </Button>
                <Button 
                  component={Link} 
                  to="/orders"
                  sx={{ 
                    color: '#1f2937',
                    fontWeight: 500,
                    '&:hover': { color: '#dc2626' }
                  }}
                >
                  Заказы
                </Button>
                <Button 
                  component={Link} 
                  to="/create"
                  variant="contained"
                  sx={{ 
                    bgcolor: '#dc2626',
                    '&:hover': { bgcolor: '#b91c1c' },
                    fontWeight: 600,
                    ml: 1,
                  }}
                >
                  Новый заказ
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
          
          {/* Основной контент */}
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route path="/" element={<MenuPage />} /> {/* Главная - меню */}
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/create" element={<CreateOrderPage />} />
            </Routes>
          </Container>
          
          {/* Футер */}
          <Box 
            component="footer" 
            sx={{ 
              py: 3, 
              px: 2, 
              mt: 'auto', 
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e5e5e5',
            }}
          >
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                © {new Date().getFullYear()} Kumashaurma. Все права защищены.
              </Typography>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
};

export default App;