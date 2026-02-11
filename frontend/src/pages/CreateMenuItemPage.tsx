import * as React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  FormControl,
  InputLabel,
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

// Интерфейс для шаурмы (соответствует вашему API)
interface ShawarmaItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  isSpicy: boolean;
  hasCheese: boolean;
  isAvailable: boolean;
  imageUrl?: string;
}

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

  // Состояния
  const [formData, setFormData] = React.useState<Partial<ShawarmaItem>>({
    name: '',
    price: 0,
    description: '',
    category: 'Курица',
    isSpicy: false,
    hasCheese: false,
    isAvailable: true,
    imageUrl: ''
  });

  const [loading, setLoading] = React.useState(isEditMode);
  const [submitting, setSubmitting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Загрузка данных для редактирования
  React.useEffect(() => {
    if (isEditMode) {
      fetchShawarma();
    }
  }, [id]);

  const fetchShawarma = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5199/api/shawarma/${id}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Товар загружен:', data);
      setFormData(data);
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      showSnackbar('Ошибка загрузки товара', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (field: keyof ShawarmaItem, value: any) => {
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

    setSubmitting(true);

    try {
      const url = isEditMode 
        ? `http://localhost:5199/api/shawarma/${id}`
        : 'http://localhost:5199/api/shawarma';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      const data = await response.json();
      console.log(isEditMode ? '✅ Товар обновлен:' : '✅ Товар создан:', data);

      showSnackbar(
        isEditMode 
          ? `Товар "${data.name}" обновлен!` 
          : `Товар "${data.name}" создан!`,
        'success'
      );

      // Возврат в меню через 1.5 секунды
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Ошибка сохранения:', err);
      showSnackbar(`Ошибка: ${err.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5199/api/shawarma/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
      }

      showSnackbar('Товар успешно удален', 'success');
      
      setTimeout(() => {
        navigate('/menu');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Ошибка удаления:', err);
      showSnackbar(`Ошибка: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка товара...</Typography>
        </Box>
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
        >
          Назад
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
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
              disabled={submitting}
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
                disabled={submitting}
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
                  disabled={submitting}
                  native
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
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
              disabled={submitting}
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
                    disabled={submitting}
                    color="error"
                  />
                }
                label="Острый"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasCheese || false}
                    onChange={(e) => handleChange('hasCheese', e.target.checked)}
                    disabled={submitting}
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
                    disabled={submitting}
                    color="success"
                  />
                }
                label="Доступен для заказа"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Изображение (опционально) */}
            <Typography variant="h6" gutterBottom>
              Изображение (необязательно)
            </Typography>

            <TextField
              fullWidth
              label="URL изображения"
              value={formData.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              disabled={submitting}
              placeholder="https://example.com/image.jpg"
              helperText="Оставьте пустым, если нет изображения"
            />
          </Box>

          {/* Кнопки действий */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            {isEditMode && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={submitting}
              >
                Удалить
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/menu')}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' }
              }}
            >
              {submitting 
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