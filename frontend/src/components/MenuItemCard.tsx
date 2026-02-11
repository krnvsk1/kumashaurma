import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip
} from '@mui/material';

// Типы данных для товара
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  weight?: string; // Например: "700 гр / 1100 гр"
  category: string; // Например: "Пицца"
  isNew?: boolean; // Новинка
  isPromo?: boolean; // Акция
}

// Пропсы компонента
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(item);
    }
    console.log('Добавлено в корзину:', item.name);
  };

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
        height: '100%', // Чтобы все карточки были одной высоты
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // Для позиционирования бейджей
        overflow: 'visible', // Чтобы бейджи не обрезались
      }}
    >
      {/* Бейдж "Новинка" */}
      {item.isNew && (
        <Chip
          label="НОВИНКА"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: '#fbbf24', // Желтый цвет
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            zIndex: 1,
          }}
        />
      )}

      {/* Бейдж "Акция" */}
      {item.isPromo && (
        <Chip
          label="АКЦИЯ"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: '#dc2626', // Красный цвет
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            zIndex: 1,
          }}
        />
      )}

      {/* Изображение товара */}
      <CardMedia
        component="img"
        height="200"
        image={item.imageUrl || 'https://via.placeholder.com/300x200?text=Шаурма'}
        alt={item.name}
        sx={{
          objectFit: 'cover',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />

      {/* Контент карточки */}
      <CardContent
        sx={{
          flexGrow: 1, // Растягивается на доступное пространство
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Название товара */}
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.3,
            minHeight: '2.8em', // Фиксированная высота для названия
          }}
        >
          {item.name}
        </Typography>

        {/* Описание товара */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flexGrow: 1, // Занимает всё доступное пространство
            fontSize: '0.875rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3, // Ограничение в 3 строки
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </Typography>

        {/* Блок с весом и ценой */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mt: 'auto', // Прижимаем к низу
          }}
        >
          {/* Вес (если есть) */}
          {item.weight && (
            <Typography variant="caption" color="text.secondary">
              {item.weight}
            </Typography>
          )}

          {/* Цена */}
          <Typography
            variant="h6"
            sx={{
              color: '#dc2626', // Красный цвет как на сайте
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            от {item.price} ₽
          </Typography>
        </Box>
      </CardContent>

      {/* Кнопка "В корзину" */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleAddToCart}
          sx={{
            bgcolor: '#dc2626', // Красный цвет
            '&:hover': {
              bgcolor: '#b91c1c', // Темнее при наведении
            },
            fontWeight: 600,
            py: 1.2,
            borderRadius: 1,
            textTransform: 'none', // Не делать текст заглавными
            fontSize: '1rem',
          }}
        >
          В корзину
        </Button>
      </Box>
    </Card>
  );
};

export default MenuItemCard;