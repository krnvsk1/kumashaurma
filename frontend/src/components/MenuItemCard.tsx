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
                bgcolor: theme.palette.mode === 'light'
                  ? 'rgba(239, 68, 68, 0.9)'
                  : 'rgba(239, 68, 68, 0.8)',
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
                bgcolor: theme.palette.mode === 'light'
                  ? 'rgba(251, 191, 36, 0.9)'
                  : 'rgba(251, 191, 36, 0.8)',
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
            bgcolor: theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(0,0,0,0.7)',
            color: 'text.primary',
            fontWeight: 600,
            fontSize: '0.7rem',
            backdropFilter: 'blur(4px)',
            border: 'none',
          }}
        />
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            lineHeight: 1.3,
            color: 'text.primary',
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
            mb: 1,
          }}
        >
          {item.description || 'Без описания'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
            pt: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.5rem',
            }}
          >
            {item.price} ₽
          </Typography>

          <Button
            component={Link}
            to="/order"
            state={{ selectedItem: item }}
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { 
                bgcolor: 'primary.dark',
              },
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '0.9rem',
            }}
          >
            Заказать
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;