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
import { resolveMediaUrl } from '../utils/media';

interface MenuItemCardProps {
  item: Shawarma;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const theme = useTheme();

  const imageUrl = item.images && item.images.length > 0
    ? resolveMediaUrl(item.images[0].filePath)
    : '';

  if (!item.isAvailable) return null;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: { xs: 2, md: 3 },
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'light' ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
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
          height: { xs: 140, md: 'auto' },
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
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            {(item.children && item.children.length > 0)
              ? `от ${Math.min(...item.children.map(c => c.price))} ₽`
              : `${item.price} ₽`}
          </Typography>
          <IconButton
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: { xs: 36, md: 40 },
              height: { xs: 36, md: 40 },
              borderRadius: '9999px',
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
