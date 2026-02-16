import * as React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  InputAdornment
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useShawarma, useCreateShawarma, useUpdateShawarma, useDeleteShawarma } from '../api/hooks';
import type { CreateShawarmaDto } from '../types';

// Категории для выпадающего списка
const CATEGORIES = [
  'Курица',
  'Баранина',
  'Говядина',
  'Вегетарианская',
  'Рыбная',
  'Острая',
  'Детская',
  'Фирменная'
];

const CreateShawarmaPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Используем наши хуки!
  const { data: existingShawarma, isLoading: isLoadingShawarma } = useShawarma(
    isEditMode ? Number(id) : 0
  );
  const createShawarma = useCreateShawarma();
  const updateShawarma = useUpdateShawarma();
  const deleteShawarma = useDeleteShawarma();

  // Состояние формы
  const [formData, setFormData] = React.useState<CreateShawarmaDto>({
    name: '',
    price: 0,
    description: '',
    category: 'Курица',
    isSpicy: false,
    hasCheese: false,
    isAvailable: true
  });

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Заполняем форму данными при редактировании
  React.useEffect(() => {
    if (existingShawarma) {
      setFormData({
        name: existingShawarma.name,
        price: existingShawarma.price,
        description: existingShawarma.description,
        category: existingShawarma.category,
        isSpicy: existingShawarma.isSpicy,
        hasCheese: existingShawarma.hasCheese,
        isAvailable: existingShawarma.isAvailable
      });
    }
  }, [existingShawarma]);

  // Определяем, идет ли загрузка (для UI)
  const isPending = 
    createShawarma.isPending || 
    updateShawarma.isPending || 
    deleteShawarma.isPending;

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (field: keyof CreateShawarmaDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      showSnackbar('Введите название товара', 'error');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      showSnackbar('Введите корректную цену', 'error');
      return false;
    }
    if (!formData.description?.trim()) {
      showSnackbar('Введите описание товара', 'error');
      return false;
    }
    if (!formData.category) {
      showSnackbar('Выберите категорию', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode && id) {
        // Обновление существующего товара
        await updateShawarma.mutateAsync({
          id: Number(id),
          ...formData
        });
        showSnackbar(`Товар "${formData.name}" обновлен!`, 'success');
      } else {
        // Создание нового товара
        const result = await createShawarma.mutateAsync(formData);
        showSnackbar(`Товар "${result.name}" создан!`, 'success');
      }

      // Возврат в меню через 1.5 секунды
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error: any) {
      showSnackbar(`Ошибка: ${error.message || 'Неизвестная ошибка'}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      await deleteShawarma.mutateAsync(Number(id));
      showSnackbar('Товар успешно удален', 'success');
      
      setTimeout(() => {
        navigate('/menu');
      }, 1500);

    } catch (error: any) {
      showSnackbar(`Ошибка: ${error.message}`, 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Показываем загрузку
  if (isLoadingShawarma) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Загрузка товара...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Шапка с кнопкой назад */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
          disabled={isPending}
        >
          Назад
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Редактировать товар' : 'Добавить новый товар'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {/* Основная информация */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Основная информация
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Название */}
            <TextField
              fullWidth
              label="Название товара *"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isPending}
              helperText="Например: Классическая шаурма"
              required
            />

            {/* Цена и Категория в одной строке */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                label="Цена *"
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                disabled={isPending}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₽</InputAdornment>,
                  inputProps: { min: 0, step: 10 }
                }}
                required
              />

              <FormControl fullWidth>
                <InputLabel>Категория *</InputLabel>
                <Select
                  value={formData.category || ''}
                  label="Категория *"
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={isPending}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Описание */}
            <TextField
              fullWidth
              label="Описание *"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isPending}
              multiline
              rows={3}
              helperText="Подробное описание состава"
              required
            />

            <Divider sx={{ my: 2 }} />

            {/* Характеристики */}
            <Typography variant="h6" gutterBottom>
              Характеристики
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isSpicy || false}
                    onChange={(e) => handleChange('isSpicy', e.target.checked)}
                    disabled={isPending}
                    color="error"
                  />
                }
                label="Острая"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasCheese || false}
                    onChange={(e) => handleChange('hasCheese', e.target.checked)}
                    disabled={isPending}
                    color="warning"
                  />
                }
                label="С сыром"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable ?? true}
                    onChange={(e) => handleChange('isAvailable', e.target.checked)}
                    disabled={isPending}
                    color="success"
                  />
                }
                label="Доступен для заказа"
              />
            </Box>

            {/* Примечание: изображения пока нет в API */}
            <Alert severity="info" sx={{ mt: 2 }}>
              Функция загрузки изображений будет добавлена позже
            </Alert>
          </Box>

          {/* Кнопки действий */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            {isEditMode && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={isPending}
              >
                Удалить
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={isPending}
              sx={{
                bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              {isPending 
                ? 'Сохранение...' 
                : isEditMode ? 'Сохранить' : 'Создать'
              }
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateShawarmaPage;