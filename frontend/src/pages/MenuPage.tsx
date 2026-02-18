import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Paper,
  useTheme
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import MenuItemCard from '../components/MenuItemCard';
import { useShawarmas } from '../api/hooks';
import type { Shawarma } from '../types';
import ProductModal from '../components/ProductModal';
import { useCartStore } from '../store/cartStore';

interface Category {
  name: string;
  count: number;
}

const MenuPage: React.FC = () => {
  const theme = useTheme();
  const { data: menuItems, isLoading, error } = useShawarmas();
  const [selectedProduct, setSelectedProduct] = useState<Shawarma | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleProductClick = (item: Shawarma) => {
    setSelectedProduct(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const categories = useMemo<Category[]>(() => {
    if (!menuItems) return [];
    
    const categoryMap = new Map<string, number>();
    menuItems.forEach(item => {
      if (item.isAvailable) {
        const count = categoryMap.get(item.category) || 0;
        categoryMap.set(item.category, count + 1);
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      if (!item.isAvailable) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || 
               (item.description?.toLowerCase().includes(query) ?? false);
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = useCartStore(state => state.addItem);

  const handleAddToCart = (product: Shawarma, quantity: number) => {
    addToCart(product, quantity);
    console.log('🛒 Добавлено в корзину:', { product, quantity });
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Загружаем меню...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          Ошибка загрузки меню: {error.message}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ borderRadius: 3 }}
        >
          Попробовать снова
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок в стиле Bento */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            letterSpacing: '-0.02em',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
              : 'linear-gradient(135deg, #ff6b6b 0%, #ffa05e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Наше Меню
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
          Свежие ингредиенты, любимые рецепты
        </Typography>
      </Box>

      {/* Поиск и кнопка добавления */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            placeholder="Поиск блюд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              }
            }}
          />
          
          <Button
            component={Link}
            to="/admin/create"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            Добавить товар
          </Button>
        </Box>

        {/* Категории в виде чипсов */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            label={`Все (${menuItems?.filter(i => i.isAvailable).length || 0})`}
            onClick={() => setSelectedCategory('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          />
          {categories.map((category) => (
            <Chip
              key={category.name}
              label={`${category.name} (${category.count})`}
              onClick={() => setSelectedCategory(category.name)}
              color={selectedCategory === category.name ? 'primary' : 'default'}
              variant={selectedCategory === category.name ? 'filled' : 'outlined'}
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Динамическая Bento-сетка */}
      {filteredItems.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            😔 Ничего не найдено
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В этой категории пока нет товаров'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: filteredItems.length === 1 
                ? '1fr' 
                : filteredItems.length === 2 
                  ? '1fr 1fr' 
                  : 'repeat(3, 1fr)',
            },
            gap: 3,
            autoRows: 'minmax(200px, auto)',
          }}
        >
          {filteredItems.map((item, index) => (
            <Box
              key={item.id}
              onClick={() => handleProductClick(item)}
              sx={{
                cursor: 'pointer',
                ...(index === 0 && filteredItems.length > 2 && {
                  gridColumn: { md: 'span 2' },
                  gridRow: { md: 'span 2' },
                }),
                ...(index === filteredItems.length - 1 && 
                  filteredItems.length % 2 === 1 && 
                  filteredItems.length > 2 && {
                  gridColumn: { md: 'span 3' },
                }),
              }}
            >
              <MenuItemCard item={item} />
            </Box>
          ))}
        </Box>
      )}

      {/* Счётчик товаров */}
      {filteredItems.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Показано {filteredItems.length} из {menuItems?.filter(i => i.isAvailable).length || 0} товаров
          </Typography>
        </Paper>
      )}

      {/* Модальное окно */}
      <ProductModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
    </Container>
  );
};

export default MenuPage;