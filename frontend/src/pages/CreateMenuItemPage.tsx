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
  useTheme,
  Modal,
  Slider
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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

interface TempImage {
  file: File;
  preview: string;
}

const CreateMenuItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Состояния для загрузки
  const [uploading, setUploading] = React.useState(false);
  const [tempImages, setTempImages] = React.useState<TempImage[]>([]);
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [currentCropImage, setCurrentCropImage] = React.useState<TempImage | null>(null);
  const [crop, setCrop] = React.useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [completedCrop, setCompletedCrop] = React.useState<Crop | null>(null);

  // Хуки для работы с изображениями (только для режима редактирования)
  const uploadImage = useUploadImage();
  const { data: images = [], refetch: refetchImages } = useShawarmaImages(Number(id) || 0);
  const deleteImage = useDeleteImage();

  // Основные данные товара
  const { data: existingShawarma, isLoading: isLoadingShawarma } = useShawarma(
    isEditMode ? Number(id) : 0
  );
  const createShawarma = useCreateShawarma();
  const updateShawarma = useUpdateShawarma();
  const deleteShawarma = useDeleteShawarma();

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

  // Заполняем форму при редактировании
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

  // Функция для кадрирования изображения
  const getCroppedImg = async (
    imageSrc: string,
    crop: Crop
  ): Promise<Blob | null> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width!;
    canvas.height = crop.height!;

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x! * scaleX,
        crop.y! * scaleY,
        crop.width! * scaleX,
        crop.height! * scaleY,
        0,
        0,
        crop.width!,
        crop.height!
      );
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  // Обработчик выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file);
      setTempImages(prev => [...prev, { file, preview }]);
    });

    event.target.value = '';
  };

  // Открыть редактор для изображения
  const openCropModal = (image: TempImage) => {
    setCurrentCropImage(image);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5
    });
    setZoom(1);
    setRotation(0);
    setCropModalOpen(true);
  };

  // Сохранить откадрированное изображение
  const handleCropComplete = async () => {
    if (!currentCropImage || !completedCrop) return;

    try {
      const croppedBlob = await getCroppedImg(
        currentCropImage.preview,
        completedCrop
      );

      if (croppedBlob) {
        const croppedFile = new File(
          [croppedBlob],
          currentCropImage.file.name,
          { type: 'image/jpeg' }
        );

        setTempImages(prev =>
          prev.map(img =>
            img === currentCropImage
              ? { ...img, file: croppedFile, preview: URL.createObjectURL(croppedBlob) }
              : img
          )
        );
      }

      setCropModalOpen(false);
      setCurrentCropImage(null);
    } catch (error) {
      console.error('Ошибка при кадрировании:', error);
      showSnackbar('Ошибка при обработке изображения', 'error');
    }
  };

  // Удалить временное изображение
  const handleDeleteTempImage = (index: number) => {
    setTempImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Загрузить изображения для существующего товара
  const handleUploadExistingImage = async (file: File) => {
    if (!id) return;
    
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

  // Удалить существующее изображение
  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync(imageId);
      await refetchImages();
      showSnackbar('Изображение удалено', 'success');
    } catch (error: any) {
      showSnackbar(`Ошибка удаления: ${error.message}`, 'error');
    }
  };

  // Отправка формы
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditMode && id) {
        // Обновление существующего товара
        await updateShawarma.mutateAsync({
          id: Number(id),
          ...formData
        });
        
        // Загружаем временные изображения
        for (const tempImage of tempImages) {
          await handleUploadExistingImage(tempImage.file);
        }
        
        showSnackbar(`Товар "${formData.name}" обновлен!`, 'success');
        
        setTimeout(() => {
          navigate('/admin/menu');
        }, 1500);
        
      } else {
        // Создание нового товара
        const result = await createShawarma.mutateAsync(formData);
        
        // Загружаем временные изображения
        for (const tempImage of tempImages) {
          await uploadImage.mutateAsync({ 
            shawarmaId: result.id, 
            file: tempImage.file 
          });
        }
        
        showSnackbar(`Товар "${result.name}" создан!`, 'success');
        
        setTimeout(() => {
          navigate('/admin/menu');
        }, 1500);
      }

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
        navigate('/admin/menu');
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
          onClick={() => navigate('/admin/menu')}
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

            {/* Загрузка новых изображений (до сохранения) */}
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
                Выбрать изображения
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Button>
              {uploading && <CircularProgress size={24} />}
            </Box>

            {/* Временные изображения (до сохранения) */}
            {tempImages.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Новые изображения:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  {tempImages.map((img, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        width: 120,
                        height: 120,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={img.preview}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          display: 'flex',
                          gap: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => openCropModal(img)}
                          sx={{
                            bgcolor: theme.palette.mode === 'light' 
                              ? 'rgba(255,255,255,0.9)' 
                              : 'rgba(0,0,0,0.7)',
                            border: `1px solid ${theme.palette.divider}`,
                            '&:hover': { 
                              bgcolor: theme.palette.mode === 'light' ? 'white' : 'black',
                            }
                          }}
                        >
                          <CropIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTempImage(index)}
                          sx={{
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
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </>
            )}

            {/* Существующие изображения (только для редактирования) */}
            {isEditMode && images.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Загруженные изображения:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
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
                        onClick={() => handleDeleteExistingImage(image.id)}
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
              onClick={() => navigate('/admin/menu')}
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

      {/* Модальное окно для кадрирования */}
      <Modal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            width: '90%',
            maxWidth: 800,
            p: 3,
            borderRadius: 4,
            outline: 'none',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Редактирование изображения
          </Typography>
          
          {currentCropImage && (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s',
                  }}
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                  >
                    <img
                      src={currentCropImage.preview}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'block',
                      }}
                      alt=""
                    />
                  </ReactCrop>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Масштаб</Typography>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(_, val) => setZoom(val as number)}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Поворот</Typography>
                <Slider
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(_, val) => setRotation(val as number)}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setCropModalOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCropComplete}
                >
                  Применить
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Modal>

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