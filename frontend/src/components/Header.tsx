// src/components/Header.tsx
import { AppBar, Toolbar, Typography, IconButton, Badge, Box } from '@mui/material';
import { ShoppingCart} from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="sticky" sx={{ 
      bgcolor: 'white', 
      color: 'text.primary',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <Toolbar>
        <Typography variant="h5" sx={{ 
          fontWeight: 700, 
          color: '#06f',
          flexGrow: 1,
        }}>
          КУМА ШАУРМА
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            10:00−21:55
          </Typography>
        </Box>

        <IconButton color="inherit">
          <Badge badgeContent={3} color="primary">
            <ShoppingCart />
          </Badge>
        </IconButton>
        <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
          0 ₽
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header; // Важно: не забудьте экспорт!