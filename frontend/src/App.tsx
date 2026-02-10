import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  ThemeProvider, createTheme, CssBaseline 
} from '@mui/material';
import { LocalDining as RestaurantIcon } from '@mui/icons-material';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35',
    },
    secondary: {
      main: '#2e7d32',
    },
  },
});

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static">
            <Toolbar>
              <RestaurantIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Kumashaurma 🥙
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Дашборд
              </Button>
              <Button color="inherit" component={Link} to="/orders">
                Заказы
              </Button>
              <Button color="inherit" component={Link} to="/create">
                Новый заказ
              </Button>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/create" element={<CreateOrderPage />} />
            </Routes>
          </Container>
          
          <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: '#f5f5f5' }}>
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
