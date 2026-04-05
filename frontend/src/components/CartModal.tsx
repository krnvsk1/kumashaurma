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
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  LocalOffer as OfferIcon,
  Check as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';
import type { DeliveryType } from '../store/orderFlowStore';
import { useValidatePromoCode, usePointsBalance, useRedeemPoints } from '../api/hooks';
import type { PromoCodeValidation } from '../types';
import { useAuthStore } from '../store/authStore';
import { resolveMediaUrl } from '../utils/media';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  address: string;
  onAddressChange: (addr: string) => void;
  onPromoApplied?: (promo: PromoCodeValidation | null) => void;
  onPointsApplied?: (discount: number) => void;
}

const CartModal: React.FC<CartModalProps> = ({
  open,
  onClose,
  onCheckout,
  deliveryType,
  onDeliveryTypeChange,
  address,
  onAddressChange,
  onPromoApplied,
  onPointsApplied,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const items = useCartStore(state => state.items);
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  const { updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<PromoCodeValidation | null>(null);

  const [pointsInput, setPointsInput] = React.useState('');
  const [appliedPointsDiscount, setAppliedPointsDiscount] = React.useState(0);
  const [pointsError, setPointsError] = React.useState('');

  const validatePromo = useValidatePromoCode();
  const { data: pointsBalanceData } = usePointsBalance();
  const redeemPoints = useRedeemPoints();

  const pointsBalance = pointsBalanceData?.balance ?? 0;

  const MIN_ORDER = 499;
  const deliveryPrice = 0;
  const isMinOrderReached = totalPrice >= MIN_ORDER;
  const deliveryOptions: DeliveryType[] = ['Доставка', 'Самовывоз', 'В зале'];

  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount - appliedPointsDiscount);

  // Reset points when cart changes
  React.useEffect(() => {
    if (items.length === 0) {
      setPointsInput('');
      setAppliedPointsDiscount(0);
      setPointsError('');
      onPointsApplied?.(0);
    }
  }, [items.length]);

  const maxPoints = Math.min(pointsBalance, Math.max(0, totalPrice - discountAmount));

  const handleApplyPoints = async () => {
    const pts = parseInt(pointsInput, 10);
    if (isNaN(pts) || pts <= 0) {
      setPointsError('Введите количество баллов');
      return;
    }
    if (pts > maxPoints) {
      setPointsError(`Максимум ${maxPoints} баллов`);
      return;
    }
    try {
      const result = await redeemPoints.mutateAsync({ pointsToRedeem: pts });
      setAppliedPointsDiscount(result.discountAmount);
      setPointsError('');
      onPointsApplied?.(result.discountAmount);
    } catch (err: any) {
      setPointsError(err?.response?.data?.message || err?.message || 'Ошибка списания баллов');
    }
  };

  const handleRemovePoints = () => {
    setPointsInput('');
    setAppliedPointsDiscount(0);
    setPointsError('');
    onPointsApplied?.(0);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const result = await validatePromo.mutateAsync({
        code: promoCode.trim(),
        orderAmount: totalPrice,
      });
      if (result.valid) {
        setAppliedPromo(result);
        onPromoApplied?.(result);
      } else {
        setAppliedPromo(null);
        onPromoApplied?.(null);
      }
    } catch {
      setAppliedPromo(null);
      onPromoApplied?.(null);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    onPromoApplied?.(null);
  };

  // Reset promo when cart changes
  React.useEffect(() => {
    if (items.length === 0) {
      handleRemovePromo();
    }
  }, [items.length]);

  // Re-validate promo when total changes
  React.useEffect(() => {
    if (appliedPromo && items.length > 0) {
      validatePromo.mutate({
        code: promoCode.trim(),
        orderAmount: totalPrice,
      }).then(result => {
        if (result.valid) {
          setAppliedPromo(result);
          onPromoApplied?.(result);
        } else {
          handleRemovePromo();
        }
      }).catch(() => handleRemovePromo());
    }
  }, [totalPrice]);

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
              sx={{ borderRadius: '9999px', fontWeight: 500 }}
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
            const basePrice = item.selectedChild?.price ?? item.price;
            const itemTotal = (basePrice + addonsTotal) * item.quantity;
            const displayName = item.selectedChild
              ? `${item.name} — ${item.selectedChild.name}`
              : item.name;

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
                    {displayName}
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
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '50%', bgcolor: theme.palette.mode === 'light' ? '#ecfeff' : 'rgba(34,211,238,0.1)', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.uniqueKey, 1)}
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '50%', bgcolor: theme.palette.mode === 'light' ? '#ecfeff' : 'rgba(34,211,238,0.1)', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
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

        {/* Списать баллы */}
        {isAuthenticated && pointsBalance > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 3,
              borderColor: appliedPointsDiscount > 0 ? 'warning.main' : theme.palette.divider,
              bgcolor: appliedPointsDiscount > 0
                ? (theme.palette.mode === 'light' ? '#fffbeb' : '#3a2a0a')
                : 'transparent',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon sx={{ color: appliedPointsDiscount > 0 ? 'warning.main' : 'text.secondary', fontSize: 20 }} />
              {appliedPointsDiscount > 0 ? (
                <>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                    Списано {pointsInput} баллов
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleRemovePoints}
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                  >
                    Отмена
                  </Button>
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    placeholder={`Использовать баллы (макс. ${maxPoints})`}
                    value={pointsInput}
                    onChange={(e) => {
                      setPointsInput(e.target.value.replace(/[^0-9]/g, ''));
                      setPointsError('');
                    }}
                    variant="standard"
                    type="number"
                    inputProps={{ min: 0, max: maxPoints }}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: (
                        <Button
                          size="small"
                          onClick={handleApplyPoints}
                          disabled={redeemPoints.isPending || !pointsInput || items.length === 0}
                          sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                        >
                          {redeemPoints.isPending ? <CircularProgress size={16} /> : 'Применить'}
                        </Button>
                      ),
                    }}
                  />
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Доступно: {pointsBalance} баллов
              </Typography>
              {appliedPointsDiscount > 0 && (
                <Typography variant="caption" color="warning.main" fontWeight={600}>
                  −{appliedPointsDiscount} ₽
                </Typography>
              )}
            </Box>
            {pointsError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {pointsError}
              </Typography>
            )}
          </Paper>
        )}

        {/* Промокод */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            borderColor: appliedPromo ? 'success.main' : theme.palette.divider,
            bgcolor: appliedPromo
              ? (theme.palette.mode === 'light' ? '#f0fdf4' : '#1a3a1a')
              : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {appliedPromo ? (
              <CheckIcon sx={{ color: 'success.main' }} />
            ) : (
              <OfferIcon sx={{ color: 'text.secondary' }} />
            )}
            <TextField
              fullWidth
              placeholder="Промокод"
              value={promoCode}
              onChange={(e) => {
                if (!appliedPromo) {
                  setPromoCode(e.target.value.toUpperCase());
                }
              }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                readOnly: !!appliedPromo,
                endAdornment: appliedPromo ? (
                  <Button
                    size="small"
                    onClick={handleRemovePromo}
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                  >
                    Удалить
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || validatePromo.isPending || items.length === 0}
                    sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                  >
                    {validatePromo.isPending ? <CircularProgress size={16} /> : 'Применить'}
                  </Button>
                ),
              }}
            />
          </Box>
          {appliedPromo && (
            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
              {appliedPromo.message}
            </Typography>
          )}
          {!appliedPromo && validatePromo.isError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {validatePromo.error?.response?.data?.message || validatePromo.error?.message || 'Промокод не найден'}
            </Typography>
          )}
        </Paper>

        {/* Итого */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Товары в заказе {totalItems} шт.</Typography>
            <Typography fontWeight={600}>{totalPrice} ₽</Typography>
          </Box>
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="success.main">Скидка по промокоду</Typography>
              <Typography fontWeight={600} color="success.main">−{discountAmount} ₽</Typography>
            </Box>
          )}
          {appliedPointsDiscount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="warning.main">Скидка баллами</Typography>
              <Typography fontWeight={600} color="warning.main">−{appliedPointsDiscount} ₽</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Доставка</Typography>
            <Typography fontWeight={600}>{deliveryPrice} ₽</Typography>
          </Box>
          {!isMinOrderReached && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Пожалуйста, дозакажите до минимальной суммы. Минимальный заказ — {MIN_ORDER} ₽
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
          <Box>
            <Typography color="text.secondary">Итого</Typography>
            <Typography variant="body2" color="text.secondary">
              Бонусы к начислению
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography fontWeight={700} color="primary.main" sx={{ fontSize: '1.25rem' }}>
              {finalPrice} ₽
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              +{Math.round(finalPrice * 0.02)} ₽
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
        <Button
          variant="contained"
          onClick={onCheckout}
          fullWidth
          disabled={!isMinOrderReached || items.length === 0}
          sx={{
            borderRadius: '9999px',
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
