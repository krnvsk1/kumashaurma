import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import MenuItemCard from '../components/MenuItemCard';
import { useShawarmas } from '../api/hooks';
import type { Shawarma } from '../types';

// Интерфейс для категории (создаём на лету из данных)
interface Category {
  name: string;
  count: number;
}

const MenuPage: React.FC = () => {
  // Используем готовый хук!
  const { data: menuItems, isLoading, error } = useShawarmas();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Получаем категории из данных (мемоизируем, чтобы не пересчитывать при каждом рендере)
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
      .sort((a, b) => a.name.localeCompare(b.name)); // сортировка по алфавиту
  }, [menuItems]);

  // Фильтрация товаров (тоже мемоизируем)
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      // Фильтр по доступности
      if (!item.isAvailable) return false;
      
      // Фильтр по категории
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      
      // Фильтр по поиску
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || 
               (item.description?.toLowerCase().includes(query) ?? false);
      }
      
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Обработчик добавления в корзину
  const handleAddToCart = (item: Shawarma) => {
    console.log('🛒 Добавлено в корзину:', item);
    // TODO: реализовать корзину
  };

  // Обработчик смены таба
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setSelectedCategory('all');
    } else if (categories[newValue - 1]) {
      setSelectedCategory(categories[newValue - 1].name);
    }
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Загружаем меню...</Typography>
        </Box>
      </Container>
    );
  }

  // Ошибка загрузки
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Ошибка загрузки меню: {error.message}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ bgcolor: '#ef4444' }}
        >
          Попробовать снова
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок и поиск */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#ef4444',
            textAlign: 'center',
            mb: 3,
          }}
        >
          Наше Меню
        </Typography>

        {/* Поиск и кнопка добавления */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Поиск блюд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            component={Link}
            to="/admin/create" // правильный путь из вашего роутинга
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              minWidth: '160px',
              height: '56px',
            }}
          >
            Добавить товар
          </Button>
        </Box>

        {/* Категории */}
        {categories.length > 0 && (
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Все</span>
                  <Chip 
                    label={menuItems?.filter(i => i.isAvailable).length || 0} 
                    size="small" 
                    sx={{ height: 20 }}
                  />
                </Box>
              } 
            />
            {categories.map((category) => (
              <Tab
                key={category.name}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{category.name}</span>
                    <Chip label={category.count} size="small" sx={{ height: 20 }} />
                  </Box>
                }
              />
            ))}
          </Tabs>
        )}
      </Box>

      {/* Сетка товаров */}
      {filteredItems.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            😔 Ничего не найдено
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В этой категории пока нет товаров'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr',
            lg: '1fr 1fr 1fr 1fr'
          },
          gap: 3
        }}>
          {filteredItems.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAddToCart={handleAddToCart} 
            />
          ))}
        </Box>
      )}

      {/* Статистика */}
      {filteredItems.length > 0 && (
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Показано {filteredItems.length} из {menuItems?.filter(i => i.isAvailable).length || 0} товаров
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default MenuPage;