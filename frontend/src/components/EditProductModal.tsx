import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  Divider,
  useTheme,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
  Slider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { Shawarma, CreateShawarmaDto, ShawarmaImage } from '../types';
import { useUploadImage, useShawarmaImages, useDeleteImage, useUpdateShawarma } from '../api/hooks';

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Shawarma | null;
}

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

const EditProductModal: React.FC<EditProductModalProps> = ({
  open,
  onClose,
  product
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateShawarmaDto>({
    name: '',
    price: 0,
    description: '',
    category: 'Курица',
    isSpicy: false,
    hasCheese: false,
    isAvailable: true
  });

  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [existingImages, setExistingImages] = useState<ShawarmaImage[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState<TempImage | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadImage = useUploadImage();
  const deleteImage = useDeleteImage();
  const updateShawarma = useUpdateShawarma();

  // Загружаем существующие изображения
  const { data: images = [], refetch: refetchImages } = useShawarmaImages(product?.id || 0);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        isSpicy: product.isSpicy,
        hasCheese: product.hasCheese,
        isAvailable: product.isAvailable
      });
    }
  }, [product]);

  useEffect(() => {
    if (images.length > 0) {
      setExistingImages(images);
    }
  }, [images]);

  const handleChange = (field: keyof CreateShawarmaDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file);
      setTempImages(prev => [...prev, { file, preview }]);
    });

    event.target.value = '';
  };

  const handleDeleteTempImage = (index: number) => {
    setTempImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync(imageId);
      await refetchImages();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

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
    }
  };

  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    try {
      // Обновляем основные данные
      await updateShawarma.mutateAsync({
        id: product.id,
        ...formData
      });

      // Загружаем новые изображения
      for (const tempImage of tempImages) {
        await uploadImage.mutateAsync({ 
          shawarmaId: product.id, 
          file: tempImage.file 
        });
      }

      // Закрываем модалку и переходим на страницу управления меню
      onClose();
      navigate('/admin/menu');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: '1000px',
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
          }
        }}
      >
        {/* Заголовок */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Редактирование товара
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Левая колонка - изображения */}
            <Box sx={{ width: { xs: '100%', md: '40%' } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Изображения
              </Typography>

              {/* Кнопка загрузки */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2, borderRadius: 2 }}
              >
                Добавить изображения
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Button>

              {/* Существующие изображения */}
              {existingImages.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Загруженные:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {existingImages.map((img) => (
                      <Paper
                        key={img.id}
                        sx={{
                          position: 'relative',
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: img.isPrimary ? `2px solid ${theme.palette.primary.main}` : 'none',
                        }}
                      >
                        <img
                          src={`http://localhost:5199${img.filePath}`}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExistingImage(img.id)}
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
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Временные изображения */}
              {tempImages.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Новые:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {tempImages.map((img, index) => (
                      <Paper
                        key={index}
                        sx={{
                          position: 'relative',
                          width: 80,
                          height: 80,
                          borderRadius: 2,
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
                        <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => openCropModal(img)}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': { bgcolor: 'white' }
                            }}
                          >
                            <CropIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTempImage(index)}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': { bgcolor: 'white' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Правая колонка - форма */}
            <Box sx={{ width: { xs: '100%', md: '60%' } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Основная информация
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Название"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  size="small"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Цена"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₽</InputAdornment>,
                    }}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={formData.category}
                      label="Категория"
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  fullWidth
                  label="Описание"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={3}
                  size="small"
                />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isSpicy}
                        onChange={(e) => handleChange('isSpicy', e.target.checked)}
                        color="error"
                      />
                    }
                    label="Острая"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasCheese}
                        onChange={(e) => handleChange('hasCheese', e.target.checked)}
                        color="warning"
                      />
                    }
                    label="С сыром"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isAvailable}
                        onChange={(e) => handleChange('isAvailable', e.target.checked)}
                        color="success"
                      />
                    }
                    label="Доступен"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1
        }}>
          <Button onClick={onClose} variant="outlined">
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
            sx={{ bgcolor: 'primary.main' }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модалка кадрирования */}
      <Dialog
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Редактирование изображения</DialogTitle>
        <DialogContent>
          {currentCropImage && (
            <Box sx={{ mt: 2 }}>
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropModalOpen(false)}>Отмена</Button>
          <Button onClick={handleCropComplete} variant="contained">
            Применить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditProductModal;