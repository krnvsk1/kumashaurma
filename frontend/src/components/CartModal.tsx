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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';
import type { DeliveryType } from '../store/orderFlowStore';
import { resolveMediaUrl } from '../utils/media';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  address: string;
  onAddressChange: (addr: string) => void;
}

const CartModal: React.FC<CartModalProps> = ({
  open,
  onClose,
  onCheckout,
  deliveryType,
  onDeliveryTypeChange,
  address,
  onAddressChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const items = useCartStore(state => state.items);
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  const { updateQuantity, removeItem } = useCartStore();

  const [promoCode, setPromoCode] = React.useState('');
  const [promoError, setPromoError] = React.useState(false);

  const MIN_ORDER = 499;
  const deliveryPrice = 0;
  const isMinOrderReached = totalPrice >= MIN_ORDER;
  const deliveryOptions: DeliveryType[] = ['Доставка', 'Самовывоз', 'В зале'];

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
      fullScreen={isMobile}
      fullWidth={!isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          bgcolor: 'background.paper',
          maxHeight: isMobile ? '100%' : '90vh',
          margin: isMobile ? 0 : undefined,
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          pb: 1,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)' }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
          Корзина
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {deliveryOptions.map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => onDeliveryTypeChange(type)}
              variant={deliveryType === type ? 'filled' : 'outlined'}
              color={deliveryType === type ? 'primary' : 'default'}
              sx={{ borderRadius: 2, fontWeight: 500 }}
            />
          ))}
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />

      <DialogContent sx={{ p: isMobile ? 2 : 3, pt: 1 }}>
        {deliveryType === 'Доставка' && (
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
              onChange={(e) => onAddressChange(e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true }}
            />
          </Paper>
        )}

        <List sx={{ mb: 2 }}>
          {items.map((item) => {
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
                        src={resolveMediaUrl(item.images[0].filePath)}
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
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.25rem' }}>
                    {item.name}
                  </Typography>

                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <Box sx={{ mt: 0.5, mb: 1 }}>
                      {item.selectedAddons.map((addon, idx) => (
                        <Typography key={idx} variant="caption" color="text.secondary" display="block">
                          • {addon.addonName} {addon.quantity > 1 ? `×${addon.quantity}` : ''} +{addon.price * addon.quantity} ₽
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {item.specialInstructions && (
                    <Typography variant="caption" color="info.main" sx={{ display: 'block', mb: 1 }}>
                      ✏️ {item.specialInstructions}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.25rem' }}>
                      {itemTotal} ₽
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.uniqueKey, -1)}
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.uniqueKey, 1)}
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
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

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            borderColor: promoError ? 'error.main' : theme.palette.divider,
            bgcolor: promoError ? (theme.palette.mode === 'light' ? '#fff5f5' : '#4a1f1f') : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <OfferIcon sx={{ color: promoError ? 'error.main' : 'text.secondary' }} />
            <TextField
              fullWidth
              placeholder="Промокод ШАУРМА"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(false); }}
              variant="standard"
              InputProps={{ disableUnderline: true }}
            />
          </Box>
          {promoError && (
            <Typography variant="caption" color="error">
              Не найдены блюда в корзине для промокода
            </Typography>
          )}
        </Paper>

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
          <Typography fontWeight={600} color="primary.main">+{Math.round(totalPrice * 0.02)} ₽</Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
        <Button
          variant="contained"
          onClick={onCheckout}
          fullWidth
          disabled={!isMinOrderReached || items.length === 0}
          sx={{
            borderRadius: 3,
            py: 2,
            fontSize: isMobile ? '1rem' : '1.1rem',
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