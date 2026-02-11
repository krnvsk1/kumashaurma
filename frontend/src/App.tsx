import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  ThemeProvider, createTheme, CssBaseline 
} from '@mui/material';
import { LocalDining as RestaurantIcon, ShoppingCart, Schedule } from '@mui/icons-material';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import MenuPage from './pages/MenuPage';
import CreateShawarmaPage from './pages/CreateMenuItemPage';

// Создаем тему в стиле kumashaurma.ru
const theme = createTheme({
  palette: {
    primary: {
      main: '#06f', // Красный как на сайте
    },
    secondary: {
      main: '#fbbf24', // Желтый для акцентов
    },
    background: {
      default: '#FFFFFF', // Светло-желтый фонт
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
              bgcolor: '#0E1C28', 
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
                  color: '#FFFFFF',
                  flexGrow: 1,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <RestaurantIcon sx={{ color: '#FFFFFF' }} />
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
                    color: '#FFFFFF',
                    fontWeight: 500,
                    '&:hover': { color: '#FFFFFF' }
                  }}
                >
                  Меню
                </Button>
                <Button 
                  component={Link} 
                  to="/orders"
                  sx={{ 
                    color: '#FFFFFF',
                    fontWeight: 500,
                    '&:hover': { color: '#FFFFFF' }
                  }}
                >
                  Заказы
                </Button>
                <Button 
                  component={Link} 
                  to="/create"
                  //variant="contained"
                  sx={{ 
                    bgcolor: '#FFFFFF',
                    '&:hover': { bgcolor: '#FFFFFF' },
                    fontWeight: 600,
                    //ml: 1,
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
              <Route path="/menu/new" element={<CreateShawarmaPage />} />
              <Route path="/menu/edit/:id" element={<CreateShawarmaPage />} />
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
                © {new Date().getFullYear()} Кума Шаурма. Все права защищены.
              </Typography>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </Router>
  );
};

export default App;