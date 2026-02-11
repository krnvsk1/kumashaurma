import React, { useState, useEffect } from 'react';
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
import { Search as SearchIcona, Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom'; 
import { Search as SearchIcon } from '@mui/icons-material';
import MenuItemCard from '../components/MenuItemCard';

// Типы данных
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  weight?: string;
  isNew?: boolean;
  isPromo?: boolean;
  isAvailable?: boolean;
}

interface Category {
  id: number;
  name: string;
  count: number;
}

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Загрузка меню из БД
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        
        // Загружаем меню с бэкенда
        const response = await fetch('http://localhost:5199/api/shawarma');
        
        if (!response.ok) {
          throw new Error(`Ошибка загрузки меню: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Меню загружено:', data);
        
        // Преобразуем данные из бэкенда в наш формат
        const formattedItems: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || 'Без описания',
          price: item.price,
          imageUrl: item.imageUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(item.name)}`,
          category: item.category || 'Другое',
          weight: item.weight,
          isNew: item.isNew || false,
          isPromo: item.isPromo || false,
          isAvailable: item.isAvailable !== false
        }));
        
        setMenuItems(formattedItems);
        
        // Создаем категории из данных
        const categoryMap = new Map<string, number>();
        formattedItems.forEach(item => {
          if (item.isAvailable) {
            const count = categoryMap.get(item.category) || 0;
            categoryMap.set(item.category, count + 1);
          }
        });
        
        const categoryList: Category[] = Array.from(categoryMap.entries()).map(([name, count], index) => ({
          id: index + 1,
          name,
          count
        }));
        
        setCategories(categoryList);
        setError(null);
      } catch (err) {
        console.error('❌ Ошибка загрузки меню:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        
        // Тестовые данные на случай ошибки
        setMenuItems(getTestData());
        setCategories([
          { id: 1, name: 'Шаурма', count: 5 },
          { id: 2, name: 'Пицца', count: 3 },
          { id: 3, name: 'Напитки', count: 2 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Фильтрация товаров
  const filteredItems = menuItems.filter(item => {
    // Фильтр по доступности
    if (item.isAvailable === false) return false;
    
    // Фильтр по категории
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    
    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) || 
             item.description.toLowerCase().includes(query);
    }
    
    return true;
  });

  // Обработчик добавления в корзину
  const handleAddToCart = (item: MenuItem) => {
    console.log('🛒 Добавлено в корзину:', item);
    // Здесь будет логика добавления в корзину
    // Можно использовать Redux, Context API или localStorage
  };

  // Тестовые данные на случай если API не работает
  const getTestData = (): MenuItem[] => [
    {
      id: 1,
      name: 'Классическая шаурма',
      description: 'С курицей, свежими овощами и соусом',
      price: 250,
      imageUrl: 'https://via.placeholder.com/300x200?text=Шаурма+Классическая',
      category: 'Шаурма',
      isAvailable: true
    },
    {
      id: 2,
      name: 'Острая шаурма',
      description: 'С острой курицей и перцем',
      price: 280,
      imageUrl: 'https://via.placeholder.com/300x200?text=Шаурма+Острая',
      category: 'Шаурма',
      isNew: true,
      isAvailable: true
    },
    {
      id: 3,
      name: 'Пицца "Пепперони"',
      description: 'Красный соус, колбаса "Пепперони", моцарелла',
      price: 600,
      imageUrl: 'https://via.placeholder.com/300x200?text=Пицца+Пепперони',
      category: 'Пицца',
      weight: '700 гр / 33 см',
      isPromo: true,
      isAvailable: true
    },
  ];

  // Обработчик смены таба
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setSelectedCategory('all');
    } else if (categories[newValue - 1]) {
      setSelectedCategory(categories[newValue - 1].name);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Загружаем меню...</Typography>
        </Box>
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
            color: '#06f',
            textAlign: 'center',
            mb: 3,
          }}
        >
          Наше Меню
        </Typography>

        {/* Поиск и кнопка добавления в одной строке */}
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
            to="/menu/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              minWidth: '160px',
              height: '56px',
            }}
          >
            Добавить товар
          </Button>
        </Box>
        {/* Категории */}
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
                  label={menuItems.filter(i => i.isAvailable).length} 
                  size="small" 
                  sx={{ height: 20 }}
                />
              </Box>
            } 
          />
          {categories.map((category) => (
            <Tab
              key={category.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{category.name}</span>
                  <Chip label={category.count} size="small" sx={{ height: 20 }} />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Сообщение об ошибке */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}. Показаны тестовые данные.
        </Alert>
      )}

      {/* Сетка товаров */}
      {filteredItems.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            😔 Ничего не найдено
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Попробуйте изменить поисковый запрос или выбрать другую категорию
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
            <Box key={item.id}>
              <MenuItemCard item={item} onAddToCart={handleAddToCart} />
            </Box>
          ))}
        </Box>
      )}

      {/* Статистика */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Показано {filteredItems.length} из {menuItems.filter(i => i.isAvailable).length} товаров
        </Typography>
      </Box>
    </Container>
  );
};

export default MenuPage;