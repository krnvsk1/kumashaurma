import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  useTheme,
  useMediaQuery,
  Badge,
  Fab,
  Zoom,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ShoppingCart as CartIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import MenuItemCard from '../components/MenuItemCard';
import { useShawarmas } from '../api/hooks';
import type { Shawarma } from '../types';
import ProductModal from '../components/ProductModal';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';
import CartModal from '../components/CartModal';
import OrderModal from '../components/OrderModal';

interface NavCategory {
  id: string;
  name: string;
  count: number;
}

interface MenuPageProps {
  role: 'user' | 'admin';
}

const MenuPage: React.FC<MenuPageProps> = ({ role }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: menuItems, isLoading, error } = useShawarmas();

  const [selectedProduct, setSelectedProduct] = useState<Shawarma | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  const cartItems = useCartStore(state => state.items);
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  const addToCart = useCartStore(state => state.addItem);

  const [items, setItems] = useState<Shawarma[]>([]);
  useEffect(() => {
    if (menuItems) setItems(menuItems);
  }, [menuItems]);

  const handleProductClick = (item: Shawarma) => {
    setSelectedProduct(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: Shawarma, quantity: number, selectedAddons: any[], instructions: string) => {
    addToCart(product, quantity, selectedAddons, instructions);
  };

  // Рефы для заголовков категорий (правый контент)
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const setCategoryRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      categoryRefs.current.set(id, element);
    } else {
      categoryRefs.current.delete(id);
    }
  }, []);

  // Реф для контейнера списка категорий в левом меню (десктоп)
  const categoryListRef = useRef<HTMLUListElement>(null);
  // Реф для контейнера чипов на мобильных
  const chipContainerRef = useRef<HTMLDivElement>(null);

  // Фильтрация товаров по поиску
  const filteredItems = useMemo(() => {
    if (!items) return [];
    let filtered = items.filter(item => item.isAvailable);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, searchQuery]);

  // Группировка: сначала промо, потом категории
  const groupedItems = useMemo(() => {
    const promo = filteredItems.filter(item => item.isPromo);
    const others = filteredItems.filter(item => !item.isPromo);

    const categories = new Map<string, Shawarma[]>();
    others.forEach(item => {
      const cat = item.category;
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(item);
    });

    const sortedCategories = Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      promo: promo.length > 0 ? promo : null,
      categories: sortedCategories,
    };
  }, [filteredItems]);

  // Список для навигации
  const navCategories = useMemo<NavCategory[]>(() => {
    const nav: NavCategory[] = [];
    if (groupedItems.promo) {
      nav.push({ id: 'promo', name: 'Акция Месяца', count: groupedItems.promo.length });
    }
    groupedItems.categories.forEach(([catName, catItems]) => {
      nav.push({ id: catName, name: catName, count: catItems.length });
    });
    return nav;
  }, [groupedItems]);

  // Определяем высоту sticky-панелей для отступа
  const stickyOffset = useMemo(() => {
    if (isMobile) {
      // на мобильных: высота AppBar (56px) + высота панели категорий (~48px) + небольшой запас
      return (theme.mixins.toolbar.minHeight as number) + 56 + 8;
    } else {
      // на десктопе: высота AppBar (64px) + отступ от края
      return (theme.mixins.toolbar.minHeight as number) + 16;
    }
  }, [isMobile, theme]);

  // Intersection Observer для определения активной категории
  useEffect(() => {
    categoryRefs.current.clear();

    const timeout = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('data-category-id');
              if (id) setActiveCategory(id);
            }
          });
        },
        {
          threshold: 0.6,
          rootMargin: `-${stickyOffset}px 0px -${window.innerHeight * 0.7}px 0px`,
        }
      );

      categoryRefs.current.forEach((element) => {
        observer.observe(element);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [groupedItems, stickyOffset]);

  // Эффект для прокрутки левого меню к активной категории (десктоп)
  useEffect(() => {
    if (isMobile || !categoryListRef.current || !activeCategory) return;

    const activeElement = categoryListRef.current.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
    if (activeElement) {
      activeElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeCategory, isMobile]);

  // Эффект для прокрутки горизонтальных чипов к активной категории (мобильные)
  useEffect(() => {
    if (!isMobile || !chipContainerRef.current || !activeCategory) return;

    const activeChip = chipContainerRef.current.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory, isMobile]);

  // Плавная прокрутка к категории с учётом отступа
  const scrollToCategory = (id: string) => {
    const element = categoryRefs.current.get(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - stickyOffset,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">Загружаем меню...</Typography>
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
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ borderRadius: 3 }}>
          Попробовать снова
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* Десктопная версия */}
      {!isMobile ? (
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* Левая колонка – навигация */}
            <Grid size={{ md: 3, lg: 2.5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'sticky',
                  top: 80,
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                }}
              >
                <Stack spacing={1} sx={{ mb: 3 }}>
                  <Button
                    startIcon={<LocationIcon />}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    Адреса и зоны доставки
                  </Button>
                  <Button startIcon={<StarIcon />} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                    Отзывы
                  </Button>
                  <Button startIcon={<OfferIcon />} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                    Акции
                  </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Категории
                </Typography>
                <List disablePadding ref={categoryListRef}>
                  {navCategories.map((cat) => (
                    <ListItem key={cat.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        data-category-id={cat.id}
                        selected={activeCategory === cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        sx={{ borderRadius: 2, py: 0.5 }}
                      >
                        <ListItemText primary={`${cat.name} (${cat.count})`} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Правая колонка – товары */}
            <Grid size={{ md: 9, lg: 9.5 }}>
              {/* Поиск */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  {role === 'admin' && (
                    <Button
                      component={Link}
                      to="/admin/create"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: 3, px: 4, whiteSpace: 'nowrap' }}
                    >
                      Добавить товар
                    </Button>
                  )}
                </Box>
              </Paper>

              {/* Промо-блок */}
              {groupedItems.promo && (
                <Box sx={{ mb: 5 }}>
                  <Typography
                    ref={(el) => setCategoryRef('promo', el)}
                    data-category-id="promo"
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      scrollMarginTop: stickyOffset,
                    }}
                  >
                    Акция Месяца
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(2, 1fr)',
                      },
                      gap: 3,
                    }}
                  >
                    {groupedItems.promo.map((item) => (
                      <Box key={item.id} onClick={() => handleProductClick(item)} sx={{ cursor: 'pointer' }}>
                        <MenuItemCard item={item} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Обычные категории */}
              {groupedItems.categories.map(([category, items]) => (
                <Box key={category} sx={{ mb: 5 }}>
                  <Typography
                    ref={(el) => setCategoryRef(category, el)}
                    data-category-id={category}
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      scrollMarginTop: stickyOffset,
                    }}
                  >
                    {category}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(2, 1fr)',
                      },
                      gap: 3,
                    }}
                  >
                    {items.map((item) => (
                      <Box key={item.id} onClick={() => handleProductClick(item)} sx={{ cursor: 'pointer' }}>
                        <MenuItemCard item={item} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}

              {/* Пустой результат */}
              {filteredItems.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    😔 Ничего не найдено
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Попробуйте изменить поисковый запрос
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      ) : (
        /* Мобильная версия */
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Поиск */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              {role === 'admin' && (
                <Button
                  component={Link}
                  to="/admin/create"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 3, px: 4, whiteSpace: 'nowrap' }}
                >
                  Добавить товар
                </Button>
              )}
            </Box>
          </Paper>

          {/* Горизонтальные категории (sticky) */}
          <Paper
            ref={chipContainerRef}
            elevation={0}
            sx={{
              p: 1,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              position: 'sticky',
              top: (theme) => theme.mixins.toolbar.minHeight,
              zIndex: 1100,
              bgcolor: 'background.paper',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'inline-flex', gap: 1 }}>
              {navCategories.map((cat) => (
                <Chip
                  key={cat.id}
                  data-category-id={cat.id}
                  label={`${cat.name} (${cat.count})`}
                  onClick={() => scrollToCategory(cat.id)}
                  color={activeCategory === cat.id ? 'primary' : 'default'}
                  variant={activeCategory === cat.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Paper>

          {/* Промо-блок */}
          {groupedItems.promo && (
            <Box sx={{ mb: 4 }}>
              <Typography
                ref={(el) => setCategoryRef('promo', el)}
                data-category-id="promo"
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  scrollMarginTop: stickyOffset,
                }}
              >
                Акция Месяца
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                {groupedItems.promo.map((item) => (
                  <Box key={item.id} onClick={() => handleProductClick(item)} sx={{ cursor: 'pointer' }}>
                    <MenuItemCard item={item} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Обычные категории */}
          {groupedItems.categories.map(([category, items]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography
                ref={(el) => setCategoryRef(category, el)}
                data-category-id={category}
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  scrollMarginTop: stickyOffset,
                }}
              >
                {category}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                {items.map((item) => (
                  <Box key={item.id} onClick={() => handleProductClick(item)} sx={{ cursor: 'pointer' }}>
                    <MenuItemCard item={item} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

          {filteredItems.length === 0 && (
            <Box textAlign="center" py={8}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                😔 Ничего не найдено
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Попробуйте изменить поисковый запрос
              </Typography>
            </Box>
          )}
        </Container>
      )}

      {/* Плавающая кнопка корзины */}
      {cartItems.length > 0 && (
        <Zoom in={cartItems.length > 0} unmountOnExit>
          <Fab
            variant="extended"
            color="primary"
            aria-label="cart"
            onClick={() => setCartOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
              boxShadow: 4,
            }}
          >
            <Badge badgeContent={totalItems} color="error" sx={{ mr: 1 }}>
              <CartIcon />
            </Badge>
            {totalPrice} ₽
          </Fab>
        </Zoom>
      )}

      {/* Модалки */}
      <ProductModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setOrderOpen(true);
        }}
      />
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        onBackToCart={() => {
          setOrderOpen(false);
          setCartOpen(true);
        }}
      />
    </>
  );
};

export default MenuPage;