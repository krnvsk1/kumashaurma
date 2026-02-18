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
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  ListAlt as ListAltIcon,
  AddShoppingCart as AddCartIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTotalItems, useTotalPrice } from './store/cartStore';
import CartModal from './components/CartModal'; 
import OrderModal from './components/OrderModal';

// Страницы
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';
import CreateMenuItemPage from "./pages/CreateMenuItemPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  
  const { theme: themeMode, toggleTheme } = useTheme();
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🌈 Тема адаптируется под режим
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#ef4444',
      },
      secondary: {
        main: '#fbbf24',
      },
      background: {
        default: themeMode === 'light' ? '#ffffff' : '#0f172a',
        paper: themeMode === 'light' ? '#f8fafc' : '#1e293b',
      },
      text: {
        primary: themeMode === 'light' ? '#0f172a' : '#f1f5f9',
        secondary: themeMode === 'light' ? '#475569' : '#94a3b8',
      },
      divider: themeMode === 'light' ? '#e2e8f0' : '#334155',
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        '-apple-system',
        'sans-serif'
      ].join(','),
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 16,
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

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

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
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 'none',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Toolbar>
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

                <Typography 
                  variant="h5" 
                  component={Link} 
                  to="/"
                  sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    flexGrow: 1,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '1.1rem', sm: '1.5rem' }
                  }}
                >
                  <RestaurantIcon sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    КУМА ШАУРМА
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    КУМА
                  </Box>
                </Typography>
                
                <IconButton
                  onClick={toggleTheme}
                  sx={{ 
                    color: 'text.primary',
                    mr: 1,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.05)' 
                        : 'rgba(255,255,255,0.05)',
                    }
                  }}
                >
                  {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>

                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3, gap: 1 }}>
                  <Schedule fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    10:00−21:55
                  </Typography>
                </Box>

                <Box 
                  onClick={() => setCartOpen(true)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mr: { xs: 1, md: 3 },
                    color: 'text.primary',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                >
                  <Badge badgeContent={totalItems} color="primary">
                    <ShoppingCart />
                  </Badge>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      ml: 1,
                      display: { xs: 'none', sm: 'block' },
                      color: 'text.primary'
                    }}
                  >
                    {totalPrice} ₽
                  </Typography>
                </Box>

                {!isMobile && (
                  <>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button component={Link} to="/" sx={{ color: 'text.primary' }}>
                        Меню
                      </Button>
                      <Button component={Link} to="/orders" sx={{ color: 'text.primary' }}>
                        Заказы
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button 
                        component={Link} 
                        to="/admin/dashboard"
                        startIcon={<DashboardIcon />}
                        sx={{ color: 'text.primary' }}
                      >
                        Дашборд
                      </Button>
                      <Button 
                        component={Link} 
                        to="/admin/create"
                        startIcon={<AddIcon />}
                        sx={{ color: 'text.primary' }}
                      >
                        Добавить
                      </Button>
                    </Box>
                  </>
                )}
              </Toolbar>
            </AppBar>

            {/* Мобильное меню */}
            <Drawer
              anchor="left"
              open={mobileMenuOpen}
              onClose={closeMobileMenu}
              sx={{
                '& .MuiDrawer-paper': {
                  width: 280,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: '0 16px 16px 0',
                },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestaurantIcon sx={{ color: 'primary.main' }} />
                    Меню
                  </Typography>
                  <IconButton onClick={closeMobileMenu} sx={{ color: 'text.primary' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ bgcolor: theme.palette.divider, mb: 2 }} />

                <List>
                  {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        onClick={closeMobileMenu}
                        sx={{
                          borderRadius: 2,
                          bgcolor: item.highlight ? 'primary.main' : 'transparent',
                          color: item.highlight ? 'white' : 'text.primary',
                          '&:hover': {
                            bgcolor: item.highlight ? 'primary.dark' : 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: item.highlight ? 'white' : 'text.primary', minWidth: 40 }}>
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

                <Divider sx={{ bgcolor: theme.palette.divider, my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', p: 1 }}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    Время работы: 10:00−21:55
                  </Typography>
                </Box>
              </Box>
            </Drawer>
            
            <Container 
              maxWidth="lg" 
              sx={{ 
                mt: { xs: 2, sm: 4 }, 
                mb: { xs: 2, sm: 4 }, 
                flex: 1,
                px: { xs: 2, sm: 3, md: 4 }
              }}
            >
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/create" element={<CreateMenuItemPage />} />
                <Route path="/admin/edit/:id" element={<CreateMenuItemPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>

            <CartModal 
              open={cartOpen} 
              onClose={() => setCartOpen(false)}
              onCheckout={() => {
                setCartOpen(false);
                setOrderOpen(true);
              }}
            />
            <OrderModal 
                open={orderOpen} 
                onClose={() => setOrderOpen(false)}
                onBackToCart={() => {
                  setOrderOpen(false);
                  setCartOpen(true);
                }}
            />
            
            <Box 
              component="footer" 
              sx={{ 
                py: { xs: 2, sm: 3 }, 
                px: 2, 
                mt: 'auto', 
                backgroundColor: 'background.paper',
                color: 'text.primary',
                borderTop: `1px solid ${theme.palette.divider}`,
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