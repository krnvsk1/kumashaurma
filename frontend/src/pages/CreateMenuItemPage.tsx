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
  IconButton,
  Paper,
  useTheme
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
  const theme = useTheme();
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
      {/* Шапка */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          disabled={isPending}
          sx={{
            mr: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            px: 2,
          }}
        >
          Назад
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          {isEditMode ? 'Редактировать товар' : 'Добавить новый товар'}
        </Typography>
      </Box>

      <Card
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Основная информация
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Название товара *"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isPending}
              helperText="Например: Классическая шаурма"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Категория *</InputLabel>
                <Select
                  value={formData.category || ''}
                  label="Категория *"
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={isPending}
                  sx={{ borderRadius: 3 }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                }
              }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Характеристики
            </Typography>

            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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

            {/* Изображения */}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      py: 1,
                    }}
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
                    <Paper
                      key={image.id}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        width: 120,
                        height: 120,
                        borderRadius: 3,
                        border: image.isPrimary 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                        bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b',
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
                          top: 4,
                          right: 4,
                          bgcolor: theme.palette.mode === 'light' 
                            ? 'rgba(255,255,255,0.9)' 
                            : 'rgba(0,0,0,0.7)',
                          border: `1px solid ${theme.palette.divider}`,
                          '&:hover': { 
                            bgcolor: theme.palette.mode === 'light' ? 'white' : 'black',
                            color: 'error.main'
                          }
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
                            bottom: 4,
                            left: 4,
                            height: 24,
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Paper>
                  ))}
                </Box>
              </>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'light' ? '#e3f2fd' : '#1e3a5f',
                  color: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9',
                }}
              >
                Сначала сохраните товар, чтобы можно было загружать изображения
              </Alert>
            )}
          </Box>

          {/* Кнопки */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
            {isEditMode && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={isPending}
                sx={{
                  borderRadius: 3,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Удалить
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              disabled={isPending}
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              startIcon={isPending ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={isPending}
              sx={{
                borderRadius: 3,
                px: 4,
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
          sx={{ 
            width: '100%',
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateMenuItemPage;