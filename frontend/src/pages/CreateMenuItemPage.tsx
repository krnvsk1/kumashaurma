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
  InputAdornment,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useShawarma, useCreateShawarma, useUpdateShawarma, useDeleteShawarma } from '../api/hooks';
import type { CreateShawarmaDto, ShawarmaImage } from '../types';
import { useUploadImage, useShawarmaImages, useDeleteImage } from '../api/hooks';

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

const CreateMenuItemPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [uploading, setUploading] = React.useState(false);
  const uploadImage = useUploadImage();
  const { data: images = [], refetch: refetchImages } = useShawarmaImages(Number(id) || 0);
  const deleteImage = useDeleteImage();

  const { data: existingShawarma, isLoading: isLoadingShawarma } = useShawarma(
    isEditMode ? Number(id) : 0
  );
  const createShawarma = useCreateShawarma();
  const updateShawarma = useUpdateShawarma();
  const deleteShawarma = useDeleteShawarma();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) {
      showSnackbar('Сначала сохраните товар', 'info');
      return;
    }
    
    setUploading(true);
    try {
      await uploadImage.mutateAsync({ 
        shawarmaId: Number(id), 
        file 
      });
      await refetchImages();
      showSnackbar('Изображение загружено', 'success');
    } catch (error: any) {
      showSnackbar(`Ошибка загрузки: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync(imageId);
      await refetchImages();
      showSnackbar('Изображение удалено', 'success');
    } catch (error: any) {
      showSnackbar(`Ошибка удаления: ${error.message}`, 'error');
    }
  };

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
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

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

  const isPending = 
    createShawarma.isPending || 
    updateShawarma.isPending || 
    deleteShawarma.isPending;

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
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
      let savedId: number;
      
      if (isEditMode && id) {
        await updateShawarma.mutateAsync({
          id: Number(id),
          ...formData
        });
        savedId = Number(id);
        showSnackbar(`Товар "${formData.name}" обновлен!`, 'success');
      } else {
        const result = await createShawarma.mutateAsync(formData);
        savedId = result.id;
        showSnackbar(`Товар "${result.name}" создан!`, 'success');
        
        // Если это новый товар, перенаправляем на страницу редактирования
        setTimeout(() => {
          navigate(`/admin/edit/${savedId}`);
        }, 1500);
        return;
      }

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
        navigate('/');
      }, 1500);

    } catch (error: any) {
      showSnackbar(`Ошибка: ${error.message}`, 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Основная информация
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Название товара *"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isPending}
              helperText="Например: Классическая шаурма"
              required
            />

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

            <Divider sx={{ my: 2 }} />

            {/* Секция загрузки изображений */}
            <Typography variant="h6" gutterBottom>
              Изображения
            </Typography>

            {isEditMode ? (
              <>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploading || isPending}
                  >
                    {uploading ? 'Загрузка...' : 'Загрузить изображение'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  {uploading && <CircularProgress size={24} />}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {images.map((image: ShawarmaImage) => (
                    <Box
                      key={image.id}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        border: image.isPrimary ? '2px solid #ef4444' : '1px solid #e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={`http://localhost:5199${image.filePath}`}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(image.id)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'white' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      {image.isPrimary && (
                        <Chip
                          label="Главное"
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: 2,
                            height: 20,
                            bgcolor: '#ef4444',
                            color: 'white'
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Alert severity="info">
                Сначала сохраните товар, чтобы можно было загружать изображения
              </Alert>
            )}
          </Box>

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

export default CreateMenuItemPage;