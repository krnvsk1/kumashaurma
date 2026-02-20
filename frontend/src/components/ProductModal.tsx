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
  Radio,
  RadioGroup,
  Divider,
  Chip,
  Alert,
  TextField,
  CircularProgress,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { Shawarma, AddonCategory, Addon, SelectedAddon } from '../types';
import { useShawarmaAddons } from '../hooks/useAddons';

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
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Map<number, SelectedAddon[]>>(new Map());
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  
  // Получаем добавки для товара
  const { data: addonCategories, isLoading } = useShawarmaAddons(product?.id);

  // Сброс при смене товара
  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setSelectedAddons(new Map());
      setSpecialInstructions('');
      setErrors(new Map());
      
      // Если есть добавки по умолчанию - автоматически их выбираем
      if (addonCategories) {
        const defaultSelections = new Map<number, SelectedAddon[]>();
        
        addonCategories.forEach((category: AddonCategory) => {
          const defaultAddons = category.addons
            .filter((addon: Addon) => addon.isDefault)
            .map((addon: Addon) => ({
              addonId: addon.id,
              addonName: addon.name,
              price: addon.price,
              quantity: 1,
              categoryId: category.id,
              categoryName: category.name
            }));
          
          if (defaultAddons.length > 0) {
            defaultSelections.set(category.id, defaultAddons);
          }
        });
        
        setSelectedAddons(defaultSelections);
      }
    }
  }, [open, product, addonCategories]);

  if (!product) return null;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Обработка выбора добавок (для категорий с множественным выбором)
  const handleAddonToggle = (category: AddonCategory, addon: Addon, checked: boolean) => {
    const newSelected = new Map(selectedAddons);
    const categorySelections = newSelected.get(category.id) || [];

    if (checked) {
      // Проверка на максимум
      if (category.maxSelections > 0 && categorySelections.length >= category.maxSelections) {
        const newErrors = new Map(errors);
        newErrors.set(category.id, 
          `Можно выбрать не более ${category.maxSelections} ${getPlural(category.maxSelections, 'позиции', 'позиций')}`);
        setErrors(newErrors);
        return;
      }
      
      newSelected.set(category.id, [
        ...categorySelections,
        {
          addonId: addon.id,
          addonName: addon.name,
          price: addon.price,
          quantity: 1,
          categoryId: category.id,
          categoryName: category.name,
        }
      ]);
      // Очищаем ошибку если была
      const newErrors = new Map(errors);
      newErrors.delete(category.id);
      setErrors(newErrors);
    } else {
      newSelected.set(category.id, 
        categorySelections.filter((s: SelectedAddon) => s.addonId !== addon.id));
    }
    
    setSelectedAddons(newSelected);
  };

  // Обработка выбора для категорий с одиночным выбором (радио)
  const handleRadioChange = (category: AddonCategory, addon: Addon) => {
    const newSelected = new Map(selectedAddons);
    
    newSelected.set(category.id, [{
      addonId: addon.id,
      addonName: addon.name,
      price: addon.price,
      quantity: 1,
      categoryId: category.id,
      categoryName: category.name,
    }]);
    
    setSelectedAddons(newSelected);
    const newErrors = new Map(errors);
    newErrors.delete(category.id);
    setErrors(newErrors);
  };

  // Изменение количества добавки
  const handleAddonQuantityChange = (categoryId: number, addonId: number, delta: number) => {
    const newSelected = new Map(selectedAddons);
    const categorySelections = [...(newSelected.get(categoryId) || [])];
    
    const addonIndex = categorySelections.findIndex((s: SelectedAddon) => s.addonId === addonId);
    if (addonIndex >= 0) {
      const addon = categorySelections[addonIndex];
      const newQuantity = Math.max(1, addon.quantity + delta);
      
      // Проверка на максимальное количество для добавки
      const category = addonCategories?.find((c: AddonCategory) => c.id === categoryId);
      const addonDef = category?.addons.find((a: Addon) => a.id === addonId);
      
      if (addonDef?.maxQuantity && newQuantity > addonDef.maxQuantity) {
        return; // Не превышаем максимум
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
    
    onAddToCart(product, quantity, allSelectedAddons, specialInstructions);
    onClose();
  };

  // Подсчет итоговой цены
  const addonsTotal = Array.from(selectedAddons.values())
    .flat()
    .reduce((sum: number, addon: SelectedAddon) => sum + addon.price * addon.quantity, 0);
  
  const totalPrice = (product.price + addonsTotal) * quantity;

  // Вспомогательная функция для склонения
  function getPlural(n: number, one: string, few: string, many?: string): string {
    if (!many) many = few;
    return n % 10 === 1 && n % 100 !== 11 ? one : 
           n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="body"
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 3, 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h5" component="div" fontWeight={700}>
          {product.name}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Изображение */}
            {product.images && product.images.length > 0 && (
              <Box
                component="img"
                src={`http://localhost:5199${product.images[0].filePath}`}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: 250,
                  objectFit: 'cover',
                  borderRadius: 3,
                  mb: 3,
                }}
              />
            )}

            {/* Описание */}
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
              {product.description || 'Нет описания'}
            </Typography>

            {/* Бейджи */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              {product.isSpicy && (
                <Chip 
                  label="🌶️ Острая" 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    fontWeight: 600
                  }}
                />
              )}
              {product.hasCheese && (
                <Chip 
                  label="🧀 С сыром" 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.dark',
                    fontWeight: 600
                  }}
                />
              )}
              <Chip 
                label={product.category} 
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Добавки по категориям */}
            {addonCategories && addonCategories.length > 0 ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Добавки
                </Typography>
                
                {addonCategories.map((category: AddonCategory) => (
                  <Paper
                    key={category.id}
                    variant="outlined"
                    sx={{ 
                      p: 2.5, 
                      mb: 3, 
                      borderRadius: 3,
                      borderColor: errors.has(category.id) ? 'error.main' : 'divider',
                      bgcolor: alpha(theme.palette.background.paper, 0.8)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {category.name}
                      </Typography>
                      {category.isRequired && (
                        <Chip 
                          label="Обязательно" 
                          size="small" 
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {category.maxSelections > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          макс. {category.maxSelections}
                        </Typography>
                      )}
                    </Box>

                    {category.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                    )}

                    {errors.get(category.id) && (
                      <Alert severity="error" sx={{ mb: 2 }} icon={<InfoIcon />}>
                        {errors.get(category.id)}
                      </Alert>
                    )}

                    {/* Если категория с одиночным выбором */}
                    {category.maxSelections === 1 ? (
                      <RadioGroup
                        value={selectedAddons.get(category.id)?.[0]?.addonId || ''}
                        onChange={(e) => {
                          const addon = category.addons.find((a: Addon) => a.id === Number(e.target.value));
                          if (addon) handleRadioChange(category, addon);
                        }}
                      >
                        {category.addons.map((addon: Addon) => (
                          <FormControlLabel
                            key={addon.id}
                            value={addon.id}
                            control={<Radio />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Typography>{addon.name}</Typography>
                                {addon.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {addon.description}
                                  </Typography>
                                )}
                                <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ ml: 'auto' }}>
                                  +{addon.price} ₽
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', mr: 0 }}
                          />
                        ))}
                      </RadioGroup>
                    ) : (
                      /* Если категория с множественным выбором */
                      <FormGroup>
                        {category.addons.map((addon: Addon) => {
                          const selectedAddon = selectedAddons
                            .get(category.id)
                            ?.find((s: SelectedAddon) => s.addonId === addon.id);

                          return (
                            <Box key={addon.id} sx={{ mb: 1 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!selectedAddon}
                                    onChange={(e) => handleAddonToggle(category, addon, e.target.checked)}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Typography>{addon.name}</Typography>
                                    {addon.description && (
                                      <Typography variant="caption" color="text.secondary">
                                        {addon.description}
                                      </Typography>
                                    )}
                                    <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ ml: 'auto' }}>
                                      +{addon.price} ₽
                                    </Typography>
                                  </Box>
                                }
                                sx={{ width: '100%', mr: 0 }}
                              />
                              
                              {/* Выбор количества для добавки */}
                              {selectedAddon && addon.maxQuantity !== 1 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5, mt: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddonQuantityChange(category.id, addon.id, -1)}
                                    disabled={selectedAddon.quantity <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="body2">
                                    {selectedAddon.quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAddonQuantityChange(category.id, addon.id, 1)}
                                    disabled={addon.maxQuantity ? selectedAddon.quantity >= addon.maxQuantity : false}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                  {addon.maxQuantity && (
                                    <Typography variant="caption" color="text.secondary">
                                      макс. {addon.maxQuantity}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </FormGroup>
                    )}
                  </Paper>
                ))}
              </>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Для этого товара нет дополнительных опций
              </Alert>
            )}

            {/* Особые пожелания */}
            <Box sx={{ mt: 4 }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2, 
        flexDirection: 'column', 
        gap: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.9)
      }}>
        {/* Количество */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%'
        }}>
          <Typography variant="h6" fontWeight={600}>
            Количество:
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            p: 0.5
          }}>
            <IconButton 
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              size="small"
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
              {quantity}
            </Typography>
            <IconButton 
              onClick={() => handleQuantityChange(1)}
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Итого и кнопка */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%',
          gap: 2
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Итого:
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {totalPrice} ₽
            </Typography>
            {addonsTotal > 0 && (
              <Typography variant="caption" color="text.secondary">
                (включая добавки: +{addonsTotal} ₽)
              </Typography>
            )}
          </Box>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleAddToCart}
            disabled={isLoading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 600,
              fontSize: '1.1rem',
              minWidth: 200
            }}
          >
            В корзину
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;