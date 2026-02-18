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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Switch,
  TextField as MuiTextField
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useShawarmas, useUpdateShawarmaAvailability, useUpdateShawarmaOrder, useDeleteShawarma } from '../api/hooks';
import type { Shawarma } from '../types';

interface Category {
  name: string;
  count: number;
}

const AdminMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: menuItems, isLoading, error } = useShawarmas();
  const updateAvailability = useUpdateShawarmaAvailability();
  const updateOrder = useUpdateShawarmaOrder();
  const deleteShawarma = useDeleteShawarma();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Shawarma[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<{ id: number; value: string } | null>(null);

  // Синхронизируем items с menuItems
  React.useEffect(() => {
    if (menuItems) {
      // Активные товары с сортировкой, затем неактивные
      const active = menuItems
        .filter(item => item.isAvailable)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
      
      const inactive = menuItems
        .filter(item => !item.isAvailable)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setItems([...active, ...inactive]);
    }
  }, [menuItems]);

  const categories = useMemo<Category[]>(() => {
    if (!items) return [];
    
    const categoryMap = new Map<string, number>();
    items.forEach(item => {
      const count = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, count + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || 
               (item.description?.toLowerCase().includes(query) ?? false);
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleAvailabilityChange = async (id: number, isAvailable: boolean) => {
    setUpdatingId(id);
    try {
      await updateAvailability.mutateAsync({ id, isAvailable });
      // После изменения доступности пересортируем
      if (menuItems) {
        const updated = menuItems.map(item => 
          item.id === id ? { ...item, isAvailable } : item
        );
        const active = updated
          .filter(item => item.isAvailable)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        const inactive = updated
          .filter(item => !item.isAvailable)
          .sort((a, b) => a.name.localeCompare(b.name));
        setItems([...active, ...inactive]);
      }
    } catch (error) {
      console.error('Ошибка обновления доступности:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOrderChange = async (id: number, newOrderStr: string) => {
    const newOrder = parseInt(newOrderStr);
    if (isNaN(newOrder) || newOrder < 0) return;

    // Находим товар
    const currentItem = items.find(i => i.id === id);
    if (!currentItem || !currentItem.isAvailable) return;

    // Получаем все активные товары
    const activeItems = items.filter(i => i.isAvailable);
    const currentIndex = activeItems.findIndex(i => i.id === id);
    
    // Новый индекс (0-based)
    const newIndex = Math.min(newOrder - 1, activeItems.length - 1);
    if (newIndex === currentIndex) return;

    // Переставляем
    const newActive = [...activeItems];
    const [movedItem] = newActive.splice(currentIndex, 1);
    newActive.splice(newIndex, 0, movedItem);

    // Обновляем sortOrder
    const updates = newActive.map((item, idx) => ({
      id: item.id,
      sortOrder: idx
    }));

    try {
      await updateOrder.mutateAsync(updates);
      
      // Обновляем локальное состояние
      const newActiveWithOrder = newActive.map((item, idx) => ({ ...item, sortOrder: idx }));
      const inactive = items.filter(i => !i.isAvailable);
      setItems([...newActiveWithOrder, ...inactive]);
      
    } catch (error) {
      console.error('Ошибка обновления порядка:', error);
    }
    
    setEditingOrder(null);
  };

  const startEditingOrder = (id: number, currentOrder: number | undefined) => {
    setEditingOrder({ 
      id, 
      value: (currentOrder !== undefined ? currentOrder + 1 : '').toString() 
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await deleteShawarma.mutateAsync(id);
      // Обновляем список после удаления
      if (menuItems) {
        const updated = menuItems.filter(item => item.id !== id);
        const active = updated
          .filter(item => item.isAvailable)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        const inactive = updated
          .filter(item => !item.isAvailable)
          .sort((a, b) => a.name.localeCompare(b.name));
        setItems([...active, ...inactive]);
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Ошибка загрузки меню</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Управление меню
        </Typography>
        <Button
          component={Link}
          to="/admin/create"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 3 }}
        >
          Добавить товар
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={`Все (${items?.length || 0})`}
          onClick={() => setSelectedCategory('all')}
          color={selectedCategory === 'all' ? 'primary' : 'default'}
          variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
        />
        {categories.map((category) => (
          <Chip
            key={category.name}
            label={`${category.name} (${category.count})`}
            onClick={() => setSelectedCategory(category.name)}
            color={selectedCategory === category.name ? 'primary' : 'default'}
            variant={selectedCategory === category.name ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80}>Порядок</TableCell>
              <TableCell width={60}>Фото</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell align="right">Цена</TableCell>
              <TableCell align="center">Острая</TableCell>
              <TableCell align="center">Сыр</TableCell>
              <TableCell align="center">Доступен</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const activeIndex = items
                .filter(i => i.isAvailable)
                .findIndex(i => i.id === item.id);
              const displayOrder = item.isAvailable ? activeIndex + 1 : '—';
              
              return (
                <TableRow 
                  key={item.id} 
                  hover
                  sx={{
                    opacity: item.isAvailable ? 1 : 0.6,
                    bgcolor: item.isAvailable ? 'inherit' : 'action.hover',
                  }}
                >
                  <TableCell>
                    {item.isAvailable ? (
                      editingOrder?.id === item.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MuiTextField
                            size="small"
                            value={editingOrder.value}
                            onChange={(e) => setEditingOrder({ 
                              id: item.id, 
                              value: e.target.value 
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleOrderChange(item.id, editingOrder.value);
                              } else if (e.key === 'Escape') {
                                setEditingOrder(null);
                              }
                            }}
                            autoFocus
                            sx={{ width: 70 }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleOrderChange(item.id, editingOrder.value)}
                            color="primary"
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box 
                          onClick={() => startEditingOrder(item.id, activeIndex)}
                          sx={{ 
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover',
                            }
                          }}
                        >
                          {displayOrder}
                        </Box>
                      )
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Avatar 
                      src={item.images?.[0]?.filePath 
                        ? `http://localhost:5199${item.images[0].filePath}` 
                        : undefined
                      }
                      sx={{ width: 40, height: 40 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.name}
                      {!item.isAvailable && (
                        <Chip
                          label="Деактивирован"
                          size="small"
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.description?.substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.price} ₽</TableCell>
                  <TableCell align="center">{item.isSpicy ? '🌶️' : '-'}</TableCell>
                  <TableCell align="center">{item.hasCheese ? '🧀' : '-'}</TableCell>
                  <TableCell align="center">
                    <Switch 
                      checked={item.isAvailable}
                      onChange={(e) => handleAvailabilityChange(item.id, e.target.checked)}
                      disabled={updatingId === item.id}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small"
                      onClick={() => navigate(`/admin/edit/${item.id}`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminMenuPage;