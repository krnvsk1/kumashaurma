import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { LocalDining as RestaurantIcon } from '@mui/icons-material'
import OrdersPage from './pages/OrdersPage'
import CreateOrderPage from './pages/CreateOrderPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
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
        
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/create" element={<CreateOrderPage />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  )
}

export default App
