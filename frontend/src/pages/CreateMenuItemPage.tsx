import * as React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Chip,
  IconButton,
  Paper,
  useTheme,
  Modal,
  Slider,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Crop as CropIcon,
  Info as InfoIcon,
  Restaurant as FoodIcon,
  LocalOffer as CategoryIcon,
  AttachMoney as PriceIcon,
  Description as DescIcon,
  Tune as SettingsIcon,
  Image as ImageIcon,
  ImageOutlined as ImageIconOutlined,
  RotateLeft as RotateLeftIcon,
  ZoomOut as ZoomOutIcon,
  ZoomIn as ZoomInIcon,
  AspectRatio as AspectRatioIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useShawarma, useCreateShawarma, useUpdateShawarma, useDeleteShawarma, useShawarmas } from '../api/hooks';
import type { CreateShawarmaDto, ShawarmaImage, Shawarma } from '../types';
import { useUploadImage, useShawarmaImages, useDeleteImage } from '../api/hooks';
import { resolveMediaUrl } from '../utils/media';

interface TempImage {
  file: File;
  preview: string;
}

const SectionLabel: React.FC<{
  icon: React.ReactNode;
  label: string;
  number: number;
  hint?: string;
}> = ({ icon, label, number, hint }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.primary.main, 0.15),
          color: 'primary.main',
          fontSize: '0.85rem',
          fontWeight: 700,
        }}
      >
        {number}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {label}
          </Typography>
        </Box>
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 5 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ToggleChip: React.FC<{
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color: string;
}> = ({ icon, label, checked, onChange, disabled, color }) => {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      onClick={onChange}
      disabled={disabled}
      variant={checked ? 'filled' : 'outlined'}
      sx={{
        px: 1,
        py: 2.5,
        borderRadius: 2.5,
        fontSize: '0.85rem',
        fontWeight: checked ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        bgcolor: checked
          ? theme.palette.mode === 'light'
            ? alpha(theme.palette[color].main, 0.1)
            : alpha(theme.palette[color].main, 0.2)
          : 'transparent',
        color: checked ? theme.palette[color].main : 'text.secondary',
        borderColor: checked ? theme.palette[color].main : theme.palette.divider,
        borderWidth: 1.5,
        borderStyle: 'solid',
        '&:hover': {
          bgcolor: checked
            ? theme.palette.mode === 'light'
              ? alpha(theme.palette[color].main, 0.15)
              : alpha(theme.palette[color].main, 0.25)
            : theme.palette.mode === 'light'
              ? alpha(theme.palette.action.hover, 0.5)
              : alpha(theme.palette.action.hover, 0.2),
        },
        '& .MuiChip-icon': {
          color: checked ? theme.palette[color].main : 'text.secondary',
        },
      }}
    />
  );
};

const CreateMenuItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Состояния для загрузки
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [tempImages, setTempImages] = React.useState<TempImage[]>([]);
  const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [currentCropImage, setCurrentCropImage] = React.useState<TempImage | null>(null);
  const [crop, setCrop] = React.useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(null);
  const [aspect, setAspect] = React.useState<number | undefined>(1);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [cropProcessing, setCropProcessing] = React.useState(false);

  // Хуки для работы с изображениями (только для режима редактирования)
  const uploadImage = useUploadImage();
  const { data: images = [], refetch: refetchImages } = useShawarmaImages(Number(id) || 0);
  const deleteImage = useDeleteImage();

  // Основные данные товара
  // Получаем список карточек-категорий (parent_id = null) для привязки
  const { data: allShawarmas = [] } = useShawarmas();
  const parentCards = allShawarmas.filter(s => s.parentId === null || s.isCard);
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
    isSpicy: false,
    hasCheese: false,
    isAvailable: true,
    parentId: null,
  });

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Заполняем форму при редактировании
  React.useEffect(() => {
    if (existingShawarma) {
      setFormData({
        name: existingShawarma.name,
        price: existingShawarma.price,
        description: existingShawarma.description,
        isSpicy: existingShawarma.isSpicy,
        hasCheese: existingShawarma.hasCheese,
        isAvailable: existingShawarma.isAvailable,
        parentId: existingShawarma.parentId ?? null,
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      showSnackbar('Введите название товара', 'error');
      return false;
    }
    // Для дочерней позиции цена обязательна, для карточки-родителя — нет
    if (formData.parentId !== null && (!formData.price || formData.price <= 0)) {
      showSnackbar('Введите корректную цену', 'error');
      return false;
    }
    if (!formData.description?.trim()) {
      showSnackbar('Введите описание товара', 'error');
      return false;
    }
    return true;
  };

  // Функция для кадрирования изображения с учётом зума и поворота
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: PixelCrop,
    currentZoom: number,
    currentRotation: number
  ): Promise<Blob | null> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cropWidth = pixelCrop.width;
    const cropHeight = pixelCrop.height;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const rad = (currentRotation * Math.PI) / 180;
    const absRot = Math.abs(currentRotation);

    // Рассчитываем размер изображения с учётом поворота
    const rotW = absRot % 180 === 90 ? image.naturalHeight : image.naturalWidth;
    const rotH = absRot % 180 === 90 ? image.naturalWidth : image.naturalHeight;

    // Масштаб отображаемого изображения к натуральному
    const elImg = imgRef.current;
    const scaleX = elImg ? image.naturalWidth / (elImg.width / currentZoom) : image.naturalWidth;
    const scaleY = elImg ? image.naturalHeight / (elImg.height / currentZoom) : image.naturalHeight;

    ctx.save();
    ctx.translate(cropWidth / 2, cropHeight / 2);
    ctx.rotate(rad);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-cropWidth / 2, -cropHeight / 2);

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      cropWidth,
      cropHeight
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  };

  // Обработчик добавления файлов (общий для кнопки и drag-and-drop)
  const addFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      setTempImages((prev) => [...prev, { file, preview }]);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addFiles(files);
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  };

  // Открыть редактор для изображения
  const openCropModal = (image: TempImage) => {
    setCurrentCropImage(image);
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
    setZoom(1);
    setRotation(0);
    setAspect(1);
    setCompletedCrop(null);
    setCropProcessing(false);
    setCropModalOpen(true);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  // Сохранить откадрированное изображение
  const handleCropApply = async () => {
    if (!currentCropImage || !completedCrop) return;

    setCropProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        currentCropImage.preview,
        completedCrop,
        zoom,
        rotation
      );

      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], currentCropImage.file.name, {
          type: 'image/jpeg',
        });

        setTempImages((prev) =>
          prev.map((img) =>
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
    } finally {
      setCropProcessing(false);
    }
  };

  // Удалить временное изображение
  const handleDeleteTempImage = (index: number) => {
    setTempImages((prev) => {
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
      await uploadImage.mutateAsync({ shawarmaId: Number(id), file });
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
        await updateShawarma.mutateAsync({
          id: Number(id),
          ...formData,
        });

        for (const tempImage of tempImages) {
          await handleUploadExistingImage(tempImage.file);
        }

        showSnackbar(`Товар "${formData.name}" обновлен!`, 'success');

        setTimeout(() => {
          navigate('/admin/menu');
        }, 1500);
      } else {
        const result = await createShawarma.mutateAsync({
          ...formData,
        });

        for (const tempImage of tempImages) {
          await uploadImage.mutateAsync({ shawarmaId: result.id, file: tempImage.file });
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

  // Общий стиль полей
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      transition: 'box-shadow 0.2s ease',
      '&:hover': {
        boxShadow: `0 0 0 1px ${theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.main, 0.5)}`,
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main',
    },
  };

  // Стиль для карточки-секции
  const sectionCardSx = {
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    bgcolor: 'background.paper',
    transition: 'border-color 0.2s ease',
  };

  if (isLoadingShawarma) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={40} />
        <Typography color="text.secondary">Загрузка товара...</Typography>
      </Box>
    );
  }

  const allImages = [
    ...tempImages.map((img, i) => ({
      type: 'temp' as const,
      preview: img.preview,
      onDelete: () => handleDeleteTempImage(i),
      onCrop: () => openCropModal(img),
      id: i,
    })),
    ...images.map((image: ShawarmaImage) => ({
      type: 'existing' as const,
      preview: resolveMediaUrl(image.filePath),
      onDelete: () => handleDeleteExistingImage(image.id),
      onCrop: null,
      id: image.id,
      isPrimary: image.isPrimary,
    })),
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Шапка */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Tooltip title="Назад к меню">
          <IconButton
            onClick={() => navigate('/admin/menu')}
            disabled={isPending}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2.5,
              '&:hover': {
                bgcolor: theme.palette.mode === 'light'
                  ? alpha(theme.palette.primary.main, 0.06)
                  : alpha(theme.palette.primary.main, 0.12),
              },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {isEditMode ? 'Редактирование товара' : 'Новый товар'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            {isEditMode
              ? 'Внесите изменения и сохраните'
              : 'Заполните информацию о товаре для добавления в меню'}
          </Typography>
        </Box>
      </Box>

      {/* Основной контент: две колонки */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        {/* Левая колонка — форма */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Секция 1: Основная информация */}
          <Card sx={sectionCardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionLabel
                number={1}
                icon={<FoodIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                label="Основная информация"
                hint="Название, цена и категория товара"
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Название товара"
                  placeholder="Например: Классическая шаурма"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isPending}
                  required
                  autoFocus
                  sx={fieldSx}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="Цена"
                    type="number"
                    placeholder="0"
                    value={formData.price || ''}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    disabled={isPending}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                          <PriceIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 10 },
                    }}
                    required={formData.parentId !== null}
                    helperText={formData.parentId === null ? 'Необязательно для карточки (вычисляется из дочерних)' : undefined}
                    sx={fieldSx}
                  />

                  <Autocomplete
                    options={parentCards}
                    value={formData.parentId ? parentCards.find(c => c.id === formData.parentId) || null : null}
                    onChange={(e, value) => handleChange('parentId', value?.id ?? null)}
                    disabled={isPending}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Родительская карточка"
                        placeholder="Не выбрана = карточка-категория"
                        sx={fieldSx}
                        slotProps={{
                          inputLabel: { shrink: true },
                        }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    sx={{
                      '& .MuiAutocomplete-inputRoot': {
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Описание"
                  placeholder="Состав и особенности блюда..."
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={isPending}
                  multiline
                  rows={3}
                  required
                  sx={fieldSx}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Секция 2: Характеристики */}
          <Card sx={sectionCardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionLabel
                number={2}
                icon={<SettingsIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                label="Характеристики"
                hint="Дополнительные свойства товара"
              />

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                <ToggleChip
                  label="Острая"
                  checked={formData.isSpicy || false}
                  onChange={() => handleChange('isSpicy', !formData.isSpicy)}
                  disabled={isPending}
                  color="error"
                />
                <ToggleChip
                  label="С сыром"
                  checked={formData.hasCheese || false}
                  onChange={() => handleChange('hasCheese', !formData.hasCheese)}
                  disabled={isPending}
                  color="warning"
                />
                <ToggleChip
                  label="Доступен"
                  checked={formData.isAvailable ?? true}
                  onChange={() => handleChange('isAvailable', !formData.isAvailable)}
                  disabled={isPending}
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Правая колонка — Изображения */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card sx={sectionCardSx}>
            <CardContent sx={{ p: 3 }}>
              <SectionLabel
                number={3}
                icon={<ImageIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                label="Фотографии"
                hint="Загрузите одно или несколько изображений"
              />

              {/* Drag & Drop зона */}
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  mt: 1,
                  border: `2px dashed ${dragOver
                    ? theme.palette.primary.main
                    : theme.palette.divider}`,
                  borderRadius: 3,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  cursor: uploading || isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s ease',
                  bgcolor: dragOver
                    ? theme.palette.mode === 'light'
                      ? alpha(theme.palette.primary.main, 0.04)
                      : alpha(theme.palette.primary.main, 0.08)
                    : theme.palette.mode === 'light'
                      ? alpha(theme.palette.text.primary, 0.01)
                      : alpha(theme.palette.text.primary, 0.02),
                  opacity: uploading || isPending ? 0.5 : 1,
                }}
                onClick={() => {
                  if (!uploading && !isPending) {
                    document.getElementById('image-upload-input')?.click();
                  }
                }}
              >
                {uploading ? (
                  <>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">Загрузка...</Typography>
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.08)
                          : alpha(theme.palette.primary.main, 0.15),
                        color: 'primary.main',
                      }}
                    >
                      <UploadIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Перетащите фото сюда
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        или нажмите для выбора файла
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                      JPG, PNG до 10 МБ
                    </Typography>
                  </>
                )}

                <input
                  id="image-upload-input"
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Box>

              {/* Миниатюры загруженных изображений */}
              {allImages.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                    {allImages.length} {allImages.length === 1 ? 'фото' : allImages.length < 5 ? 'фото' : 'фото'}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                    {allImages.map((img) => (
                      <Paper
                        key={`${img.type}-${img.id}`}
                        elevation={0}
                        sx={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: 2.5,
                          border: (img as any).isPrimary
                            ? `2px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.divider}`,
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          '&:hover': { boxShadow: `0 4px 12px ${alpha('#000', 0.15)}` },
                        }}
                      >
                        <img
                          src={img.preview}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {/* Оверлей при наведении */}
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: alpha('#000', 0.4),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            '&:hover': { opacity: 1 },
                          }}
                          className="image-overlay"
                        >
                          {img.onCrop && (
                            <Tooltip title="Кадрировать">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  img.onCrop!();
                                }}
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.95)',
                                  color: 'text.primary',
                                  '&:hover': { bgcolor: 'white' },
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                <CropIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                img.onDelete();
                              }}
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.95)',
                                color: 'error.main',
                                '&:hover': { bgcolor: 'white' },
                                width: 32,
                                height: 32,
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {(img as any).isPrimary && (
                          <Chip
                            label="Главное"
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: 'primary.main',
                              color: 'white',
                            }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {isEditMode && images.length === 0 && tempImages.length === 0 && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                  <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.6 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                    У товара пока нет фотографий
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Кнопки действий */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mt: 3,
          justifyContent: 'flex-end',
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          boxShadow: `0 -2px 8px ${alpha('#000', 0.04)}`,
        }}
      >
        {isEditMode && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={isPending}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              borderWidth: 1.5,
              '&:hover': { borderWidth: 1.5 },
              mr: 'auto',
            }}
          >
            Удалить товар
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => navigate('/admin/menu')}
          disabled={isPending}
          sx={{
            borderRadius: 2.5,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
            borderWidth: 1.5,
            '&:hover': { borderWidth: 1.5 },
          }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={isPending}
          sx={{
            borderRadius: 2.5,
            px: 4,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          {isPending
            ? 'Сохранение...'
            : isEditMode
              ? 'Сохранить'
              : 'Создать товар'}
        </Button>
      </Box>

      {/* Модальное окно для кадрирования */}
      <Modal
        open={cropModalOpen}
        onClose={() => !cropProcessing && setCropModalOpen(false)}
        closeAfterTransition
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: alpha('#000', 0.6),
              backdropFilter: 'blur(4px)',
            },
          },
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
        }}
      >
        <Paper
          sx={{
            width: '92vw',
            maxWidth: 680,
            borderRadius: 3,
            outline: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
          }}
        >
          {/* Шапка модала */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <CropIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Кадрирование
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => !cropProcessing && setCropModalOpen(false)}
              sx={{
                borderRadius: 2,
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.08) },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {currentCropImage && (
            <>
              {/* Область с изображением */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: { xs: 280, sm: 380 },
                  bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease',
                    transformOrigin: 'center center',
                  }}
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                  >
                    <img
                      ref={imgRef}
                      src={currentCropImage.preview}
                      onLoad={onImageLoad}
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

              {/* Панель инструментов */}
              <Box sx={{ px: 3, pt: 2, pb: 1 }}>
                {/* Соотношение сторон */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 90 }}>
                    Пропорции:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {[{ label: 'Свобод', value: undefined }, { label: '1:1', value: 1 }, { label: '4:3', value: 4 / 3 }, { label: '16:9', value: 16 / 9 }].map(
                      (opt) => (
                        <Chip
                          key={opt.label}
                          label={opt.label}
                          size="small"
                          clickable
                          onClick={() => {
                            setAspect(opt.value);
                            setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
                          }}
                          variant={aspect === opt.value ? 'filled' : 'outlined'}
                          sx={{
                            height: 28,
                            fontSize: '0.72rem',
                            fontWeight: aspect === opt.value ? 600 : 400,
                            borderRadius: 1.5,
                            borderColor: aspect === opt.value ? 'primary.main' : theme.palette.divider,
                            borderWidth: 1.5,
                            borderStyle: 'solid',
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>

                {/* Зум и поворот — компактная строка */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                  {/* Зум */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Масштаб
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round(zoom * 100)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                        sx={{ width: 28, height: 28 }}
                      >
                        <ZoomOutIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Slider
                        value={zoom}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onChange={(_, val) => setZoom(val as number)}
                        sx={{ flex: 1, mx: 0.5 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                        sx={{ width: 28, height: 28 }}
                      >
                        <ZoomInIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Поворот */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Поворот
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label="-90°"
                          size="small"
                          clickable
                          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            borderRadius: 1.5,
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            borderStyle: 'solid',
                          }}
                        />
                        <Chip
                          label="+90°"
                          size="small"
                          clickable
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            borderRadius: 1.5,
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            borderStyle: 'solid',
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setRotation((r) => (r - 15 + 360) % 360)}
                        sx={{ width: 28, height: 28 }}
                      >
                        <RotateLeftIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Slider
                        value={rotation}
                        min={0}
                        max={359}
                        step={1}
                        onChange={(_, val) => setRotation(val as number)}
                        sx={{ flex: 1, mx: 0.5 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setRotation(0)}
                        sx={{ width: 28, height: 28 }}
                        title="Сбросить"
                      >
                        <RotateLeftIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Кнопки */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  justifyContent: 'flex-end',
                  px: 3,
                  py: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.text.primary, 0.01)
                    : alpha(theme.palette.text.primary, 0.02),
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setCropModalOpen(false)}
                  disabled={cropProcessing}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderWidth: 1.5,
                    '&:hover': { borderWidth: 1.5 },
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCropApply}
                  disabled={cropProcessing || !completedCrop}
                  startIcon={cropProcessing ? <CircularProgress size={16} color="inherit" /> : <CropIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                  }}
                >
                  {cropProcessing ? 'Применение...' : 'Применить'}
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
