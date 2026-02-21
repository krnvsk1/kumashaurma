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
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  TextField,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';

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
  const { updateQuantity, removeItem } = useCartStore();

  const [promoCode, setPromoCode] = React.useState('');
  const [promoError, setPromoError] = React.useState(false);
  const [deliveryType, setDeliveryType] = React.useState('Доставка');
  const [address, setAddress] = React.useState('Пионерский переулок, 1');

  const MIN_ORDER = 599;
  const deliveryPrice = 0;
  const isMinOrderReached = totalPrice >= MIN_ORDER;

  // Обработчик изменения количества
  const handleQuantityChange = (uniqueKey: string | undefined, delta: number) => {
    if (!uniqueKey) return;
    
    const item = items.find(item => item.uniqueKey === uniqueKey);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity < 1) {
        removeItem(uniqueKey);
      } else {
        updateQuantity(uniqueKey, newQuantity);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          maxHeight: '90vh',
        }
      }}
    >
      {/* Заголовок */}
      <DialogTitle sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Корзина
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Табы доставки */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {['Доставка', 'Самовывоз', 'В зале', 'Food Drive'].map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => setDeliveryType(type)}
              variant={deliveryType === type ? 'filled' : 'outlined'}
              color={deliveryType === type ? 'primary' : 'default'}
              sx={{
                borderRadius: 2,
                fontWeight: 500,
              }}
            />
          ))}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {/* Поиск адреса */}
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 3,
            borderColor: theme.palette.divider,
          }}
        >
          <SearchIcon sx={{ mx: 1, color: 'text.secondary' }} />
          <TextField
            fullWidth
            placeholder="Поиск адреса"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Paper>

        {/* Список товаров */}
        <List sx={{ mb: 2 }}>
          {items.map((item) => {
            // Рассчитываем стоимость с добавками
            const addonsTotal = item.selectedAddons?.reduce((sum, a) => sum + a.price * a.quantity, 0) || 0;
            const itemTotal = (item.price + addonsTotal) * item.quantity;

            return (
              <ListItem key={item.uniqueKey} sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {item.images?.[0]?.filePath ? (
                      <img
                        src={`http://localhost:5199${item.images[0].filePath}`}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 12,
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '2rem' }}>🥙</Typography>
                    )}
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                  
                  {/* Отображение добавок */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <Box sx={{ mt: 0.5, mb: 1 }}>
                      {item.selectedAddons.map((addon, idx) => (
                        <Typography key={idx} variant="caption" color="text.secondary" display="block">
                          • {addon.addonName} {addon.quantity > 1 ? `×${addon.quantity}` : ''} +{addon.price * addon.quantity} ₽
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* Особые пожелания */}
                  {item.specialInstructions && (
                    <Typography variant="caption" color="info.main" sx={{ display: 'block', mb: 1 }}>
                      ✏️ {item.specialInstructions}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                      {itemTotal} ₽
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.uniqueKey, -1)}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.uniqueKey, 1)}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>

        {/* Промокод */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            borderColor: promoError ? 'error.main' : theme.palette.divider,
            bgcolor: promoError 
              ? theme.palette.mode === 'light' ? '#fff5f5' : '#4a1f1f'
              : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <OfferIcon sx={{ color: promoError ? 'error.main' : 'text.secondary' }} />
            <TextField
              fullWidth
              placeholder="Промокод ШАУРМА"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoError(false);
              }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
              }}
            />
          </Box>
          {promoError && (
            <Typography variant="caption" color="error">
              Не найдены блюда в корзине для промокода
            </Typography>
          )}
        </Paper>

        {/* Итого */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Товары в заказе {totalItems} шт.</Typography>
            <Typography fontWeight={600}>{totalPrice} ₽</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Доставка</Typography>
            <Typography fontWeight={600}>{deliveryPrice} ₽</Typography>
          </Box>
          {!isMinOrderReached && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Пожалуйста, дозакажите до минимальной суммы. Минимальный заказ по указанному адресу — {MIN_ORDER} ₽
            </Typography>
          )}
        </Box>

        {/* Бонусы */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            borderColor: theme.palette.divider,
            bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography color="text.secondary">Бонусы к начислению</Typography>
          <Typography fontWeight={600} color="primary.main">+35 ₽</Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          variant="contained"
          onClick={onCheckout}
          fullWidth
          disabled={!isMinOrderReached || items.length === 0}
          sx={{
            borderRadius: 3,
            py: 2,
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          Продолжить оформление
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartModal;