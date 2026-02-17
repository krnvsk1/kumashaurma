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
import placeholderImage from '../assets/placeholder-shawarma.svg';

interface MenuItemCardProps {
  item: Shawarma;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const theme = useTheme();
  
  // 👇 Берём первое изображение или заглушку
  const imageUrl = item.images && item.images.length > 0 && item.images[0]?.filePath
    ? `http://localhost:5199${item.images[0].filePath}`
    : '';

  if (!item.isAvailable) {
    return null;
  }

  console.log('🖼️ Товар:', item.name, 'Изображения:', item.images);
  
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
              bgcolor: 'primary.main',
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
              bgcolor: 'secondary.main',
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
        image={imageUrl}
        alt={item.name}
        sx={{
          objectFit: 'cover',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#334155',
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
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            {item.price} ₽
          </Typography>
        </Box>
      </CardContent>

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