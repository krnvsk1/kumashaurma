import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  TextField,
  Paper,
  useTheme,
  Zoom,
  Slide
} from '@mui/material';
import type { SlideProps } from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';

// 👇 Правильно типизированный Transition
const Transition = React.forwardRef<unknown, SlideProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ open, onClose, onCheckout }) => {
  const theme = useTheme();
  const items = useCartStore(state => state.items);
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  const { updateQuantity, removeItem, clearCart } = useCartStore();

  console.log('🛒 CartModal items:', items.map(i => ({
    name: i.name,
    hasImages: !!i.images,
    imagesCount: i.images?.length,
    firstImage: i.images?.[0]?.filePath
  })));
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
          maxHeight: '80vh',
          minHeight: items.length > 0 ? '60vh' : 'auto',
        }
      }}
    >
      {/* Заголовок */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CartIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Ваша корзина
          </Typography>
          {totalItems > 0 && (
            <Typography variant="body2" color="text.secondary" component="span">
              ({totalItems} {totalItems === 1 ? 'товар' : 'товаров'})
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {items.length === 0 ? (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Zoom in={open}>
              <CartIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
            </Zoom>
            <Typography variant="h6" color="text.secondary">
              Корзина пуста
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Добавьте товары из меню
            </Typography>
            <Button 
              variant="contained" 
              onClick={onClose}
              sx={{ 
                bgcolor: 'primary.main',
                mt: 2,
                px: 4
              }}
            >
              Продолжить покупки
            </Button>
          </Box>
        ) : (
          <>
            {/* Список товаров */}
            <List sx={{ p: 2 }}>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
                      borderRadius: 2,
                      position: 'relative',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: theme.shadows[2]
                      }
                    }}
                  >
                    <ListItem alignItems="flex-start" disablePadding>
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : '#334155',
                            mr: 2
                          }}
                        >
                          {item.images?.[0]?.filePath ? (
                            <img
                              src={`http://localhost:5199${item.images[0].filePath}`}
                              alt={item.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Typography component="span" sx={{ fontSize: '2rem' }}>
                              🥙
                            </Typography>
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box component="div" sx={{ flex: 1 }}>
                        <Box component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 4 }} component="span">
                            {item.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeItem(item.id)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { 
                                color: 'error.main',
                                bgcolor: theme.palette.mode === 'light' 
                                  ? 'rgba(239, 68, 68, 0.1)' 
                                  : 'rgba(239, 68, 68, 0.2)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                          {item.price} ₽
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }} component="span">
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) updateQuantity(item.id, val);
                            }}
                            size="small"
                            sx={{ width: 50 }}
                            inputProps={{
                              min: 1,
                              style: { textAlign: 'center' }
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1,
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          
                          <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 600 }} component="span">
                            = {item.price * item.quantity} ₽
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </Paper>
                  {index < items.length - 1 && (
                    <Divider sx={{ my: 1.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      {items.length > 0 && (
        <DialogActions sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
          flexDirection: 'column',
          gap: 2
        }}>
          {/* Итого */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Товаров:</Typography>
              <Typography variant="body1" fontWeight={500}>{totalItems} шт.</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Итого:</Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {totalPrice} ₽
              </Typography>
            </Box>
          </Box>

          {/* Кнопки */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={clearCart}
              fullWidth
              size="large"
            >
              Очистить
            </Button>
            <Button
              variant="contained"
              onClick={onCheckout}
              fullWidth
              size="large"
              sx={{ bgcolor: 'primary.main' }}
            >
              Оформить заказ
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Бесплатная доставка от 500 ₽
          </Typography>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CartModal;