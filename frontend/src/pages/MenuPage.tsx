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
import type { Shawarma, SelectedAddon } from '../types';
import ProductModal from '../components/ProductModal';
import OrderModal from '../components/OrderModal';
import { useCartStore, useTotalItems, useTotalPrice } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrderFlowStore } from '../store/orderFlowStore';

interface NavCategory {
  id: string;
  name: string;
  count: number;
}

const MenuPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isAuthenticated, hasRole } = useAuthStore();
  const isAdminRole = isAuthenticated && hasRole('admin');

  const { data: menuItems, isLoading, error } = useShawarmas();

  const [selectedProduct, setSelectedProduct] = useState<Shawarma | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { openCart, orderOpen, closeOrder, backToCart, deliveryType, address, setAddress, customerName, setCustomerName, phone, setPhone } = useOrderFlowStore(
    (state) => ({
      openCart: state.openCart,
      orderOpen: state.orderOpen,
      closeOrder: state.closeOrder,
      backToCart: state.backToCart,
      deliveryType: state.deliveryType,
      address: state.address,
      setAddress: state.setAddress,
      customerName: state.customerName,
      setCustomerName: state.setCustomerName,
      phone: state.phone,
      setPhone: state.setPhone,
    })
  );

  const cartItems = useCartStore(state => state.items);
  const totalItems = useTotalItems();
  const totalPrice = useTotalPrice();
  const addToCart = useCartStore(state => state.addItem);

  const [items, setItems] = useState<Shawarma[]>([]);
  useEffect(() => {
    if (menuItems) setItems(menuItems);
  }, [menuItems]);

  // === ИЕРАРХИЧЕСКАЯ ГРУППИРОВКА ===
  // Отделяем карточки (parent_id = null) и одиночные товары (без parent_id и без children)
  const { cards, soloItems } = useMemo(() => {
    const cardsList: Shawarma[] = [];
    const soloList: Shawarma[] = [];

    items.forEach(item => {
      if (item.isCard || item.parentId === null) {
        // Это карточка-категория: показываем, только если у неё есть доступные дети
        const availableChildren = (item.children || []).filter(c => c.isAvailable);
        if (availableChildren.length > 0) {
          cardsList.push({ ...item, children: availableChildren });
        }
      }
      // Дочерние позиции обрабатываются через карточки — solo не нужны
    });

    return { cards: cardsList, soloItems: soloList };
  }, [items]);

  const handleProductClick = (item: Shawarma) => {
    setSelectedProduct(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: Shawarma, quantity: number, selectedAddons: SelectedAddon[], instructions: string, selectedChild?: Shawarma) => {
    addToCart(product, quantity, selectedAddons, instructions, selectedChild);
  };

  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const setCategoryRef = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      categoryRefs.current.set(id, element);
    } else {
      categoryRefs.current.delete(id);
    }
  }, []);

  const categoryListRef = useRef<HTMLUListElement>(null);
  const chipContainerRef = useRef<HTMLDivElement>(null);

  // === ПОИСК ===
  // Поиск работает по дочерним позициям, но возвращает карточки-родители, у которых есть совпадения
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;

    const q = searchQuery.toLowerCase();
    return cards.map(card => {
      const matchingChildren = (card.children || []).filter(child =>
        child.name.toLowerCase().includes(q) ||
        child.description?.toLowerCase().includes(q) ||
        card.name.toLowerCase().includes(q)
      );
      return matchingChildren.length > 0 ? { ...card, children: matchingChildren } : null;
    }).filter(Boolean) as Shawarma[];
  }, [cards, searchQuery]);

  // Навигационные категории — названия карточек
  const navCategories = useMemo<NavCategory[]>(() => {
    return filteredCards.map((card, idx) => ({
      id: `card-${card.id}`,
      name: card.name,
      count: (card.children || []).length,
    }));
  }, [filteredCards]);

  const stickyOffset = useMemo(() => {
    if (isMobile) {
      return (theme.mixins.toolbar.minHeight as number) + 56 + 8;
    } else {
      return (theme.mixins.toolbar.minHeight as number) + 16;
    }
  }, [isMobile, theme]);

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
          threshold: 0.3,
          rootMargin: `-${stickyOffset}px 0px -${window.innerHeight * 0.7}px 0px`,
        }
      );

      categoryRefs.current.forEach((element) => {
        observer.observe(element);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [filteredCards, stickyOffset]);

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

  useEffect(() => {
    if (!isMobile || !chipContainerRef.current || !activeCategory) return;

    const activeChip = chipContainerRef.current.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory, isMobile]);

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

  // Рендер одной карточки-родителя в сетке (клик → модалка с выбором варианта)
  const renderProductCard = (card: Shawarma) => (
    <Box key={card.id} onClick={() => handleProductClick(card)} sx={{ cursor: 'pointer' }}>
      <MenuItemCard item={card} />
    </Box>
  );

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
                  Меню
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9999px' } }}
                  />
                  {isAdminRole && (
                    <Button
                      component={Link}
                      to="/admin/create"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: '9999px', px: 4, whiteSpace: 'nowrap' }}
                    >
                      Добавить товар
                    </Button>
                  )}
                </Box>
              </Paper>

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
                {filteredCards.map((card) => renderProductCard(card))}
              </Box>

              {/* Пустой результат */}
              {filteredCards.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    Ничего не найдено
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9999px' } }}
              />
              {isAdminRole && (
                <Button
                  component={Link}
                  to="/admin/create"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: '9999px', px: 4, whiteSpace: 'nowrap' }}
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
                  label={`${cat.name}`}
                  onClick={() => scrollToCategory(cat.id)}
                  color={activeCategory === cat.id ? 'primary' : 'default'}
                  variant={activeCategory === cat.id ? 'filled' : 'outlined'}
                  sx={{ borderRadius: '9999px' }}
                />
              ))}
            </Box>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
            }}
          >
            {filteredCards.map((card) => renderProductCard(card))}
          </Box>

          {filteredCards.length === 0 && (
            <Box textAlign="center" py={8}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Ничего не найдено
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
            onClick={openCart}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
              boxShadow: 4,
              borderRadius: '9999px',
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

      <OrderModal
        open={orderOpen}
        onClose={closeOrder}
        onBackToCart={backToCart}
        deliveryType={deliveryType}
        address={address}
        onAddressChange={setAddress}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        phone={phone}
        onPhoneChange={setPhone}
      />
    </>
  );
};

export default MenuPage;
