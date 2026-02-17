import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import type { Shawarma } from '../types';

interface MenuItemCardProps {
  item: Shawarma;
  onAddToCart?: (item: Shawarma) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const theme = useTheme(); // 👈 Получаем текущую тему
  
  // Проверка доступности товара
  if (!item.isAvailable) {
    return null;
  }

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'light' 
          ? '0 4px 12px rgba(0,0,0,0.05)' 
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 24px rgba(0,0,0,0.1)'
            : '0 8px 24px rgba(0,0,0,0.5)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        bgcolor: theme.palette.mode === 'light' 
          ? 'background.paper' 
          : 'background.paper',
      }}
    >
      {/* Бейджи для характеристик */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          flexWrap: 'wrap',
          gap: 0.5,
        }}
      >
        {item.isSpicy && (
          <Chip
            label="Острая"
            size="small"
            sx={{
              bgcolor: 'primary.main', // 👈 Используем тему
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem',
            }}
          />
        )}
        
        {item.hasCheese && (
          <Chip
            label="С сыром"
            size="small"
            sx={{
              bgcolor: 'secondary.main', // 👈 Используем тему
              color: theme.palette.mode === 'light' ? 'white' : 'black',
              fontWeight: 'bold',
              fontSize: '0.7rem',
            }}
          />
        )}
      </Stack>

      {/* Категория */}
      <Chip
        label={item.category}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.6)' 
            : 'rgba(255,255,255,0.2)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          zIndex: 1,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Изображение */}
      <CardMedia
        component="img"
        height="200"
        image={`https://via.placeholder.com/300x200?text=${encodeURIComponent(item.name)}`}
        alt={item.name}
        sx={{
          objectFit: 'cover',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#334155',
          opacity: theme.palette.mode === 'dark' ? 0.9 : 1,
        }}
      />

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Название */}
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.3,
            minHeight: '2.8em',
            color: 'text.primary',
          }}
        >
          {item.name}
        </Typography>

        {/* Описание */}
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            flexGrow: 1,
            fontSize: '0.875rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.secondary',
          }}
        >
          {item.description || 'Без описания'}
        </Typography>

        {/* Цена */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 'auto',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main', // 👈 Исправлено! Используем тему
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            {item.price} ₽
          </Typography>
        </Box>
      </CardContent>

      {/* Кнопка "Заказать" */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          component={Link}
          to="/order"
          state={{ selectedItem: item }}
          fullWidth
          variant="contained"
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { 
              bgcolor: 'primary.dark',
            },
            fontWeight: 600,
            py: 1.2,
            borderRadius: 1,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Быстрый заказ
        </Button>
      </Box>
    </Card>
  );
};

export default MenuItemCard;