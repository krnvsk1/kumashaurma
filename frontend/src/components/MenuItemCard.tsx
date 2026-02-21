import React from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Shawarma } from '../types';
import placeholderImage from '../assets/placeholder-shawarma.svg';

interface MenuItemCardProps {
  item: Shawarma;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const theme = useTheme();

  const imageUrl = item.images && item.images.length > 0
    ? `http://localhost:5199${item.images[0].filePath}`
    : '';

  if (!item.isAvailable) return null;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // на мобильных колонка, на десктопе ряд
        borderRadius: { xs: 2, md: 4 }, // менее скруглённые углы на мобильных
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 20px 25px -5px rgba(0,0,0,0.05)'
            : '0 20px 25px -5px rgba(0,0,0,0.3)',
          borderColor: 'primary.main',
        },
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Фото */}
      <Box
        sx={{
          width: { xs: '100%', md: '35%' },
          height: { xs: 140, md: 'auto' }, // фиксированная высота на мобильных
          position: 'relative',
        }}
      >
        <CardMedia
          component="img"
          image={imageUrl || placeholderImage}
          alt={item.name}
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            borderTopLeftRadius: { xs: 8, md: 16 },
            borderTopRightRadius: { xs: 8, md: 0 },
            borderBottomLeftRadius: { xs: 0, md: 16 },
          }}
        />
        {/* Бейджи на фото */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
          }}
        >
          {item.isSpicy && (
            <Chip
              label="🌶️"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.9),
                color: 'white',
                fontSize: '0.7rem',
                border: 'none',
              }}
            />
          )}
          {item.hasCheese && (
            <Chip
              label="🧀"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.9),
                color: 'white',
                fontSize: '0.7rem',
                border: 'none',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Контент */}
      <Box
        sx={{
          width: { xs: '100%', md: '65%' },
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, mb: 0.5 }}>
            {item.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
              fontSize: { xs: '0.8rem', md: '0.875rem' },
            }}
          >
            {item.description || 'Без описания'}
          </Typography>
          {/* Размер/вес (заглушка) */}
          <Typography variant="caption" color="text.secondary" display="block">
            33 см / 700 г
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            от {item.price} ₽
          </Typography>
          <IconButton
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: { xs: 32, md: 36 },
              height: { xs: 32, md: 36 },
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default MenuItemCard;