import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Stack
} from '@mui/material';
import { Link } from 'react-router-dom'; // 👈 ВАЖНО: добавить импорт!
import type { Shawarma } from '../types';

interface MenuItemCardProps {
  item: Shawarma;
  onAddToCart?: (item: Shawarma) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  // Проверка доступности товара
  if (!item.isAvailable) {
    return null;
  }

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
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
              bgcolor: '#ef4444',
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
              bgcolor: '#fbbf24',
              color: 'white',
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
          bgcolor: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          zIndex: 1,
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
          bgcolor: '#f5f5f5',
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
          }}
        >
          {item.name}
        </Typography>

        {/* Описание */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flexGrow: 1,
            fontSize: '0.875rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
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
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            {item.price} ₽
          </Typography>
        </Box>
      </CardContent>

      {/* Кнопка "Заказать" с переходом на страницу создания заказа */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          component={Link}
          to="/order"
          state={{ selectedItem: item }} // 👈 Передаём товар в CreateOrderPage
          fullWidth
          variant="contained"
          sx={{
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: '#dc2626' },
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