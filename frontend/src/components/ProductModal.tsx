import React from 'react';
import {
  Dialog,
  DialogTitle,
 DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  IconButton,
  TextField,
  Divider,
  useTheme,
  CircularProgress // 👈 добавить для загрузки
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import type { Shawarma } from '../types';
import { useShawarmaImages } from '../api/hooks';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Shawarma | null;
  onAddToCart: (product: Shawarma, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onClose,
  product,
  onAddToCart
}) => {
  const theme = useTheme();
  const [quantity, setQuantity] = React.useState(1);
  
  // 👇 Загружаем изображения товара
  const { data: images, isLoading: imagesLoading } = useShawarmaImages(product?.id || 0);
  
  // 👇 Находим главное изображение
  const primaryImage = images?.find(img => img.isPrimary)?.filePath;

  if (!product) return null;

  const handleIncrease = () => setQuantity(prev => prev + 1);
  const handleDecrease = () => setQuantity(prev => Math.max(1, prev - 1));
  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
    setQuantity(1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: '800px'
        }
      }}
    >
      {/* Заголовок с кнопкой закрытия */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {product.name}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Левая колонка - изображение */}
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              height: { xs: '250px', md: '350px' },
              bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {imagesLoading ? (
              <CircularProgress />
            ) : primaryImage ? (
              <img
                src={`http://localhost:5199${primaryImage}`}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Typography variant="h1" sx={{ fontSize: '5rem', opacity: 0.5 }}>
                🥙
              </Typography>
            )}
          </Box>

          {/* Правая колонка - информация */}
          <Box sx={{ 
            width: { xs: '100%', md: '50%' },
            p: 3
          }}>
            {/* Характеристики */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {product.isSpicy && (
                <Chip
                  label="Острая"
                  size="small"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
              {product.hasCheese && (
                <Chip
                  label="С сыром"
                  size="small"
                  sx={{
                    bgcolor: 'secondary.main',
                    color: theme.palette.mode === 'light' ? 'white' : 'black',
                    fontWeight: 'bold'
                  }}
                />
              )}
              <Chip
                label={product.category}
                size="small"
                variant="outlined"
              />
            </Stack>

            {/* Описание */}
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              {product.description || 'Нет описания'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Цена и количество */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Цена:
              </Typography>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {product.price} ₽
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Количество:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  size="small"
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1
                  }}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) setQuantity(val);
                  }}
                  type="number"
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  sx={{ width: '80px' }}
                  size="small"
                />
                <IconButton
                  onClick={handleIncrease}
                  size="small"
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Итого */}
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
              p: 2,
              borderRadius: 2,
              mb: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Итого:
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {product.price * quantity} ₽
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b'
      }}>
        <Button onClick={onClose} variant="outlined">
          Отмена
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          Добавить в корзину · {product.price * quantity} ₽
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;