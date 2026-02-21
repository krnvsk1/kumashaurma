import React from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Shawarma } from '../types';
import placeholderImage from '../assets/placeholder-shawarma.svg';

interface MenuItemCardProps {
  item: Shawarma;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const theme = useTheme();
  
  const imageUrl = item.images && item.images.length > 0 && item.images[0]?.filePath
    ? `http://localhost:5199${item.images[0].filePath}`
    : '';

  if (!item.isAvailable) {
    return null;
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)'
            : '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
          borderColor: 'primary.main',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Фото наверху */}
      <Box sx={{ position: 'relative', pt: '100%' }}>
        <CardMedia
          component="img"
          image={imageUrl || placeholderImage}
          alt={item.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        {/* Чипсы поверх фото */}
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
              label="🌶️ Острая"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.9),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                backdropFilter: 'blur(4px)',
                border: 'none',
              }}
            />
          )}
          
          {item.hasCheese && (
            <Chip
              label="🧀 С сыром"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.9),
                color: theme.palette.mode === 'light' ? 'white' : 'black',
                fontWeight: 600,
                fontSize: '0.7rem',
                backdropFilter: 'blur(4px)',
                border: 'none',
              }}
            />
          )}
        </Stack>

        <Chip
          label={item.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            color: 'text.primary',
            fontWeight: 600,
            fontSize: '0.7rem',
            backdropFilter: 'blur(4px)',
            border: 'none',
          }}
        />
      </Box>

      {/* Контент: название и описание */}
      <Box sx={{ p: 2.5, pb: 1, flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            lineHeight: 1.3,
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {item.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description || 'Без описания'}
        </Typography>
      </Box>

      {/* Нижняя часть: цена слева, плюс справа */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2.5,
          pt: 1,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        {/* Цена слева */}
        <Typography
          variant="h5"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.2,
          }}
        >
          {item.price} ₽
        </Typography>

        {/* Кнопка-плюс в кружке справа */}
        <IconButton
          aria-label="Добавить в корзину"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 44,
            height: 44,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Card>
  );
};

export default MenuItemCard;