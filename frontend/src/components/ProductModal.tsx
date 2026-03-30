import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  TextField,
  CircularProgress,
  alpha,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import type { Shawarma, Addon, SelectedAddon, AddonCategory } from '../types';
import { useShawarmaAddons } from '../hooks/useAddons';
import { resolveMediaUrl } from '../utils/media';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Shawarma | null;
  onAddToCart: (product: Shawarma, quantity: number, selectedAddons: SelectedAddon[], instructions: string) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onClose,
  product,
  onAddToCart,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Map<number, SelectedAddon[]>>(new Map());
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const { data: addonCategories, isLoading } = useShawarmaAddons(product?.id);

  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setSelectedAddons(new Map());
      setSpecialInstructions('');
    }
  }, [open, product]);

  if (!product) return null;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddonToggle = (addon: Addon, checked: boolean) => {
    const newSelected = new Map(selectedAddons);
    const categoryId = addon.addonCategoryId || 0;
    const categorySelections = newSelected.get(categoryId) || [];

    if (checked) {
      newSelected.set(categoryId, [
        ...categorySelections,
        {
          addonId: addon.id,
          addonName: addon.name,
          price: addon.price,
          quantity: 1,
          categoryId: categoryId,
          categoryName: addonCategories?.find((c: AddonCategory) => c.id === categoryId)?.name || 'Добавки'
        }
      ]);
    } else {
      newSelected.set(categoryId, 
        categorySelections.filter((s: SelectedAddon) => s.addonId !== addon.id));
    }
    
    setSelectedAddons(newSelected);
  };

  const handleAddonQuantityChange = (addonId: number, delta: number) => {
    const newSelected = new Map(selectedAddons);
    const addonDef = allAddons.find((a: Addon) => a.id === addonId);
    const categoryId = addonDef?.addonCategoryId || 0;
    const categorySelections = [...(newSelected.get(categoryId) || [])];
    
    const addonIndex = categorySelections.findIndex((s: SelectedAddon) => s.addonId === addonId);
    if (addonIndex >= 0) {
      const addon = categorySelections[addonIndex];
      const newQuantity = Math.max(1, addon.quantity + delta);
      
      const allAddons = addonCategories?.flatMap(c => c.addons) || [];
      const addonDef = allAddons.find((a: Addon) => a.id === addonId);
      
      if (addonDef?.maxQuantity && newQuantity > addonDef.maxQuantity) {
        return;
      }
      
      categorySelections[addonIndex] = {
        ...addon,
        quantity: newQuantity
      };
      
      newSelected.set(categoryId, categorySelections);
      setSelectedAddons(newSelected);
    }
  };

  const handleAddToCart = () => {
    // Проверка обязательных категорий
    const missingRequired: string[] = [];
    addonCategories?.forEach((category: AddonCategory) => {
      if (category.isRequired) {
        const selected = selectedAddons.get(category.id)?.length || 0;
        if (selected < category.minSelections) {
          missingRequired.push(category.name);
        }
      }
    });
  
    if (missingRequired.length > 0) {
      alert(`Пожалуйста, выберите ${missingRequired.join(', ')}`);
      return;
    }
  
    // Собираем все выбранные добавки в один массив
    const allSelectedAddons = Array.from(selectedAddons.values()).flat();
    
    console.log('🛒 Отправка в корзину:', {
      product,
      quantity,
      allSelectedAddons,
      specialInstructions
    });
    
    onAddToCart(product, quantity, allSelectedAddons, specialInstructions);
    onClose();
  };

  const allAddons = addonCategories?.flatMap(c => c.addons) || [];
  
  const addonsTotal = Array.from(selectedAddons.values())
    .flat()
    .reduce((sum: number, addon: SelectedAddon) => sum + addon.price * addon.quantity, 0);
  
  const totalPrice = (product.price + addonsTotal) * quantity;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullScreen={isMobile}
      fullWidth={!isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          maxHeight: isMobile ? '100%' : '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: isMobile ? 2 : 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
          {product.name}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Десктоп версия - фото слева, всё остальное справа */}
            {!isMobile && (
              <Grid container spacing={3}>
                {/* Фото слева */}
                <Grid size={{ xs: 5 }}>
                  {product.images && product.images.length > 0 ? (
                    <Box
                      component="img"
                      src={resolveMediaUrl(product.images[0].filePath)}
                      alt={product.name}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 3,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 200,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">Нет фото</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Контент справа */}
                <Grid size={{ xs: 7 }}>
                  {/* Цена и вес */}
                  <Typography variant="h5" color="primary.main" fontWeight={700} gutterBottom>
                    от {product.price} ₽ • 300 г
                  </Typography>

                  {/* Описание */}
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {product.description || 'Нет описания'}
                  </Typography>

                  {/* Бейджи */}
                  {(product.isSpicy || product.hasCheese) && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                      {product.isSpicy && (
                        <Chip label="🌶️ Острая" size="small" color="error" variant="outlined" />
                      )}
                      {product.hasCheese && (
                        <Chip label="🧀 С сыром" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>
                  )}

                  {/* Добавки */}
                  {allAddons.length > 0 && (
                    <>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Добавки
                      </Typography>
                      
                      <FormGroup>
                        {allAddons.map((addon) => {
                          const selectedAddon = selectedAddons
                            .get(addon.addonCategoryId || 0)
                            ?.find((s: SelectedAddon) => s.addonId === addon.id);

                          return (
                            <Box key={addon.id} sx={{ mb: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!selectedAddon}
                                    onChange={(e) => handleAddonToggle(addon, e.target.checked)}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography>{addon.name}</Typography>
                                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                                      +{addon.price} ₽
                                    </Typography>
                                  </Box>
                                }
                              />
                              
                              {/* Выбор количества */}
                              {selectedAddon && addon.maxQuantity && addon.maxQuantity > 1 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4, mt: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddonQuantityChange(addon.id, -1)}
                                    disabled={selectedAddon.quantity <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="body2">
                                    {selectedAddon.quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddonQuantityChange(addon.id, 1)}
                                    disabled={addon.maxQuantity ? selectedAddon.quantity >= addon.maxQuantity : false}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="caption" color="text.secondary">
                                    макс. {addon.maxQuantity}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </FormGroup>
                    </>
                  )}

                  {/* Особые пожелания */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Особые пожелания
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Например: без лука, добавьте побольше соуса, острее..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Мобильная версия */}
            {isMobile && (
              <Box>
                {product.images && product.images.length > 0 && (
                  <Box
                    component="img"
                    src={resolveMediaUrl(product.images[0].filePath)}
                    alt={product.name}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 3,
                      mb: 2,
                    }}
                  />
                )}
                
                <Typography variant="h5" color="primary.main" fontWeight={700} gutterBottom>
                  от {product.price} ₽ • 300 г
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {product.description || 'Нет описания'}
                </Typography>

                {(product.isSpicy || product.hasCheese) && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    {product.isSpicy && <Chip label="🌶️ Острая" size="small" />}
                    {product.hasCheese && <Chip label="🧀 С сыром" size="small" />}
                  </Box>
                )}

                {/* Добавки для мобильных */}
                {allAddons.length > 0 && (
                  <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Добавки
                    </Typography>
                    
                    <FormGroup>
                      {allAddons.map((addon) => {
                        const selectedAddon = selectedAddons
                          .get(addon.addonCategoryId || 0)
                          ?.find((s: SelectedAddon) => s.addonId === addon.id);

                        return (
                          <Box key={addon.id} sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!selectedAddon}
                                  onChange={(e) => handleAddonToggle(addon, e.target.checked)}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography>{addon.name}</Typography>
                                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                                    +{addon.price} ₽
                                  </Typography>
                                </Box>
                              }
                            />
                            
                            {selectedAddon && addon.maxQuantity && addon.maxQuantity > 1 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4, mt: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAddonQuantityChange(addon.id, -1)}
                                  disabled={selectedAddon.quantity <= 1}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2">
                                  {selectedAddon.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAddonQuantityChange(addon.id, 1)}
                                  disabled={addon.maxQuantity ? selectedAddon.quantity >= addon.maxQuantity : false}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </FormGroup>
                  </>
                )}

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Особые пожелания
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Например: без лука, добавьте побольше соуса, острее..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3, 
        flexDirection: 'column', 
        gap: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Количество:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} size="small">
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{quantity}</Typography>
              <IconButton onClick={() => handleQuantityChange(1)} size="small">
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            onClick={handleAddToCart}
            disabled={isLoading}
            sx={{ borderRadius: 3, px: 4 }}
          >
            В корзину {totalPrice} ₽
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;