import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  alpha,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Fastfood as FastfoodIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useShawarmas, useDeleteShawarma, useUpdateShawarmaAvailability } from '../api/hooks';
import { 
  useAddonCategories, 
  useCreateAddonCategory,
  useUpdateAddonCategory,
  useDeleteAddonCategory,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
  useLinkAddonToShawarma
} from '../hooks/useAddons';
import type { AddonCategory, Addon } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminMenuPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  
  // Состояния для диалогов
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    category?: AddonCategory;
  }>({ open: false, mode: 'create' });

  const [addonDialog, setAddonDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    categoryId?: number;
    addon?: Addon;
  }>({ open: false, mode: 'create' });

  // Новый диалог для привязки группы к товару
  const [linkCategoryDialog, setLinkCategoryDialog] = useState<{
    open: boolean;
    shawarmaId?: number;
    shawarmaName?: string;
  }>({ open: false });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Хуки для данных
  const { data: shawarmas = [] } = useShawarmas();
  const { data: categories = [] } = useAddonCategories();
  
  // Мутации
  const deleteProduct = useDeleteShawarma();
  const updateAvailability = useUpdateShawarmaAvailability();
  
  const createCategory = useCreateAddonCategory();
  const updateCategory = useUpdateAddonCategory();
  const deleteCategory = useDeleteAddonCategory();
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();
  const linkAddon = useLinkAddonToShawarma();

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Обработчики для категорий
  const handleSaveCategory = async (data: Partial<AddonCategory>) => {
    try {
      if (categoryDialog.mode === 'create') {
        await createCategory.mutateAsync(data);
        showMessage('Категория добавок создана', 'success');
      } else if (categoryDialog.category?.id) {
        await updateCategory.mutateAsync({ id: categoryDialog.category.id, ...data });
        showMessage('Категория добавок обновлена', 'success');
      }
      setCategoryDialog({ open: false, mode: 'create' });
    } catch (error) {
      showMessage('Ошибка при сохранении категории', 'error');
    }
  };

  // Удаление категории добавок
  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (window.confirm(`Удалить категорию "${categoryName}"? Все добавки в этой категории станут недоступны.`)) {
      try {
        await deleteCategory.mutateAsync(categoryId);
        showMessage('Категория удалена', 'success');
      } catch (error) {
        showMessage('Ошибка при удалении категории', 'error');
      }
    }
  };

  // Обработчики для добавок - с явным полем категории
  const handleSaveAddon = async (data: Partial<Addon> & { addonCategoryId: number }) => {
    try {
      console.log('📤 ===== НАЧАЛО ОТПРАВКИ ДОБАВКИ =====');
      console.log('📤 Данные из формы:', data);
      
      if (addonDialog.mode === 'create') {
        // Отправляем данные с явным ID категории
        const addonData = {
          name: data.name!,
          description: data.description || '',
          price: data.price || 0,
          addonCategoryId: data.addonCategoryId,  // Явно из формы
          isAvailable: data.isAvailable ?? true,
          displayOrder: 0
        };
        
        console.log('📤 Данные для отправки:', JSON.stringify(addonData, null, 2));
        
        const result = await createAddon.mutateAsync(addonData);
        
        console.log('✅ Добавка создана:', result);
        showMessage('Добавка создана', 'success');
        setAddonDialog({ open: false, mode: 'create' });
      } else if (addonDialog.mode === 'edit' && addonDialog.addon?.id) {
        // Для редактирования отправляем только изменяемые поля
        const updateData: any = {
          id: addonDialog.addon.id
        };
        
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
        
        await updateAddon.mutateAsync(updateData);
        showMessage('Добавка обновлена', 'success');
        setAddonDialog({ open: false, mode: 'create' });
      }
    } catch (error: any) {
      console.error('❌ ===== ОШИБКА =====');
      console.error('❌ Статус:', error.response?.status);
      console.error('❌ Данные ответа:', error.response?.data);
      
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, 'error');
      } else {
        showMessage('Ошибка при сохранении добавки', 'error');
      }
    }
  };

  // Привязка группы добавок к товару
  const handleLinkCategoryToShawarma = async (categoryId: number, shawarmaId: number) => {
    try {
      // Получаем все добавки из этой группы
      const category = categories.find(c => c.id === categoryId);
      
      if (!category) return;
      
      // Привязываем каждую добавку из группы к товару
      for (const addon of category.addons) {
        await linkAddon.mutateAsync({
          addonId: addon.id,
          shawarmaId,
          isDefault: false,
          maxQuantity: 1
        });
      }
      
      showMessage(`Группа "${category.name}" привязана к товару`, 'success');
      setLinkCategoryDialog({ open: false });
    } catch (error) {
      showMessage('Ошибка при привязке группы', 'error');
    }
  };

  const handleDeleteAddon = async (addonId: number) => {
    if (window.confirm('Удалить эту добавку?')) {
      try {
        await deleteAddon.mutateAsync(addonId);
        showMessage('Добавка удалена', 'success');
      } catch (error) {
        showMessage('Ошибка при удалении добавки', 'error');
      }
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Управление меню
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<FastfoodIcon />}
            onClick={() => navigate('/admin/create')}
          >
            Добавить товар
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setCategoryDialog({ open: true, mode: 'create' })}
          >
            Добавить группу добавок
          </Button>
        </Box>
      </Box>

      {/* Табы */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Tab label="Товары" />
          <Tab label="Добавки" />
        </Tabs>

        {/* Панель товаров */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>Доступность</TableCell>
                  <TableCell>Группы добавок</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shawarmas.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Typography fontWeight={600}>{product.name}</Typography>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price} ₽</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.isAvailable}
                        onChange={(e) => updateAvailability.mutate({
                          id: product.id,
                          isAvailable: e.target.checked
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Привязать группу добавок">
                        <IconButton 
                          size="small"
                          onClick={() => setLinkCategoryDialog({ 
                            open: true, 
                            shawarmaId: product.id,
                            shawarmaName: product.name 
                          })}
                          color="primary"
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Редактировать товар">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/admin/edit/${product.id}`)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить товар">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => {
                            if (window.confirm(`Удалить товар "${product.name}"?`)) {
                              deleteProduct.mutate(product.id);
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Панель добавок */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCategoryDialog({ open: true, mode: 'create' })}
            >
              Добавить группу добавок
            </Button>
          </Box>

          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid key={category.id} size={{ xs: 12 }}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {category.name}
                        </Typography>
                        {category.isRequired && (
                          <Chip label="Обязательно" size="small" color="primary" />
                        )}
                        {category.maxSelections > 0 && (
                          <Chip 
                            label={`Макс. ${category.maxSelections}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleToggleCategory(category.id)}>
                          {expandedCategory === category.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Tooltip title="Редактировать категорию">
                          <IconButton 
                            size="small" 
                            onClick={() => setCategoryDialog({ open: true, mode: 'edit', category })}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить категорию">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {category.description && (
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {category.description}
                      </Typography>
                    )}

                    <Collapse in={expandedCategory === category.id}>
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Кнопка добавления добавки */}
                      <Button
                        startIcon={<AddIcon />}
                        size="small"
                        onClick={() => setAddonDialog({ 
                          open: true, 
                          mode: 'create', 
                          categoryId: category.id 
                        })}
                        sx={{ mb: 2 }}
                      >
                        Добавить добавку
                      </Button>

                      {/* Список добавок */}
                      <List>
                        {category.addons?.map((addon) => (
                          <ListItem
                            key={addon.id}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                              borderRadius: 2,
                              mb: 1
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontWeight={500}>{addon.name}</Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {addon.description}
                                  </Typography>
                                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                                    +{addon.price} ₽
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Редактировать добавку">
                                <IconButton 
                                  size="small"
                                  onClick={() => setAddonDialog({ 
                                    open: true, 
                                    mode: 'edit', 
                                    addon,
                                    categoryId: category.id 
                                  })}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Удалить добавку">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteAddon(addon.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Диалог для категории добавок */}
      <CategoryDialog
        open={categoryDialog.open}
        onClose={() => setCategoryDialog({ open: false, mode: 'create' })}
        category={categoryDialog.category}
        onSave={handleSaveCategory}
        loading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Диалог для добавки */}
      <AddonDialog
        open={addonDialog.open}
        onClose={() => setAddonDialog({ open: false, mode: 'create' })}
        addon={addonDialog.addon}
        categoryId={addonDialog.categoryId}
        categories={categories}
        onSave={handleSaveAddon}
        loading={createAddon.isPending || updateAddon.isPending}
      />

      {/* Диалог для привязки группы к товару */}
      <LinkCategoryDialog
        open={linkCategoryDialog.open}
        onClose={() => setLinkCategoryDialog({ open: false })}
        shawarmaId={linkCategoryDialog.shawarmaId}
        shawarmaName={linkCategoryDialog.shawarmaName}
        categories={categories}
        onLink={handleLinkCategoryToShawarma}
        loading={linkAddon.isPending}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Компонент диалога для категории
const CategoryDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  category?: AddonCategory;
  onSave: (data: Partial<AddonCategory>) => void;
  loading: boolean;
}> = ({ open, onClose, category, onSave, loading }) => {
  const [formData, setFormData] = useState<Partial<AddonCategory>>({
    name: '',
    description: '',
    isRequired: false,
    minSelections: 0,
    maxSelections: 0
  });

  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isRequired: category.isRequired || false,
        minSelections: category.minSelections || 0,
        maxSelections: category.maxSelections || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isRequired: false,
        minSelections: 0,
        maxSelections: 0
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {category ? 'Редактировать группу' : 'Новая группа добавок'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название группы"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              />
            }
            label="Обязательная категория"
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Мин. выбор"
                value={formData.minSelections}
                onChange={(e) => setFormData({ ...formData, minSelections: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Макс. выбор"
                value={formData.maxSelections}
                onChange={(e) => setFormData({ ...formData, maxSelections: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
                helperText="0 = без ограничений"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Обновленный компонент диалога для добавки с выбором категории
const AddonDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  addon?: Addon;
  categoryId?: number;
  categories: AddonCategory[];
  onSave: (data: Partial<Addon> & { addonCategoryId: number }) => void;
  loading: boolean;
}> = ({ open, onClose, addon, categoryId, categories, onSave, loading }) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number;
    isAvailable: boolean;
    addonCategoryId: number;
  }>({
    name: '',
    description: '',
    price: 0,
    isAvailable: true,
    addonCategoryId: categoryId || (categories[0]?.id || 0)
  });

  React.useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name || '',
        description: addon.description || '',
        price: addon.price || 0,
        isAvailable: addon.isAvailable ?? true,
        addonCategoryId: addon.addonCategoryId || categoryId || (categories[0]?.id || 0)
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        isAvailable: true,
        addonCategoryId: categoryId || (categories[0]?.id || 0)
      });
    }
  }, [addon, categoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Введите название добавки');
      return;
    }
    
    if (formData.price < 0) {
      alert('Цена не может быть отрицательной');
      return;
    }
    
    if (!formData.addonCategoryId) {
      alert('Выберите категорию');
      return;
    }
    
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: formData.price,
      isAvailable: formData.isAvailable,
      addonCategoryId: formData.addonCategoryId
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {addon ? 'Редактировать добавку' : 'Новая добавка'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Категория добавки</InputLabel>
            <Select
              value={formData.addonCategoryId}
              label="Категория добавки"
              onChange={(e) => setFormData({ 
                ...formData, 
                addonCategoryId: Number(e.target.value) 
              })}
              disabled={!!addon}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Название добавки"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          
          <TextField
            fullWidth
            type="number"
            label="Цена"
            value={formData.price}
            onChange={(e) => setFormData({ 
              ...formData, 
              price: parseFloat(e.target.value) || 0 
            })}
            margin="normal"
            required
            inputProps={{ min: 0, step: 0.5 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isAvailable: e.target.checked 
                })}
              />
            }
            label="Доступно"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Компонент диалога для привязки группы к товару
const LinkCategoryDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  shawarmaId?: number;
  shawarmaName?: string;
  categories: AddonCategory[];
  onLink: (categoryId: number, shawarmaId: number) => void;
  loading: boolean;
}> = ({ open, onClose, shawarmaId, shawarmaName, categories, onLink, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shawarmaId && selectedCategory) {
      onLink(selectedCategory as number, shawarmaId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Привязать группу добавок к товару "{shawarmaName}"
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Выберите группу добавок</InputLabel>
            <Select
              value={selectedCategory}
              label="Выберите группу добавок"
              onChange={(e) => setSelectedCategory(e.target.value as number)}
              required
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name} ({category.addons?.length || 0} добавок)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!selectedCategory || loading}
          >
            Привязать группу
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminMenuPage;