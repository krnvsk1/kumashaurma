import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
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
  Switch,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  useTheme,
  Grid,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  LocalOffer as PromoIcon,
  Percent as PercentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from '../api/hooks';
import type { PromoCode } from '../types';

// ==================== Form data interface ====================

interface PromoCodeFormData {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  maxUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const emptyForm: PromoCodeFormData = {
  code: '',
  discountType: 'percent',
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  maxUses: 0,
  validFrom: '',
  validUntil: '',
  isActive: true,
};

const promoToForm = (promo: PromoCode): PromoCodeFormData => ({
  code: promo.code,
  discountType: promo.discountType as 'percent' | 'fixed',
  discountValue: promo.discountValue,
  minOrderAmount: promo.minOrderAmount,
  maxDiscountAmount: promo.maxDiscountAmount ?? 0,
  maxUses: promo.maxUses ?? 0,
  validFrom: promo.validFrom ? promo.validFrom.slice(0, 16) : '',
  validUntil: promo.validUntil ? promo.validUntil.slice(0, 16) : '',
  isActive: promo.isActive,
});

const formToApi = (form: PromoCodeFormData): Partial<PromoCode> => ({
  code: form.code.trim(),
  discountType: form.discountType,
  discountValue: form.discountValue,
  minOrderAmount: form.minOrderAmount,
  maxDiscountAmount: form.maxDiscountAmount || null,
  maxUses: form.maxUses || null,
  validFrom: form.validFrom || null,
  validUntil: form.validUntil || null,
  isActive: form.isActive,
});

// ==================== Helper functions ====================

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isExpired = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

// ==================== Main Page Component ====================

const AdminPromoCodesPage: React.FC = () => {
  const theme = useTheme();

  // Data
  const { data: promoCodes = [], isLoading, error, refetch, isRefetching } = usePromoCodes();
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();
  const deletePromo = useDeletePromoCode();

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Clipboard state (for "Copied!" feedback)
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // ==================== Handlers ====================

  const handleCreate = () => {
    setEditingPromo(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (promo: PromoCode) => {
    setDeletingPromo(promo);
    setDeleteDialogOpen(true);
  };

  const handleCopyCode = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      showMessage(`Промокод "${code}" скопирован`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showMessage('Не удалось скопировать', 'error');
    }
  };

  const handleSave = async (formData: PromoCodeFormData) => {
    try {
      const apiData = formToApi(formData);
      if (editingPromo) {
        await updatePromo.mutateAsync({ id: editingPromo.id, data: apiData });
        showMessage('Промокод обновлён', 'success');
      } else {
        await createPromo.mutateAsync(apiData);
        showMessage('Промокод создан', 'success');
      }
      setEditDialogOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ошибка при сохранении';
      showMessage(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingPromo) return;
    try {
      await deletePromo.mutateAsync(deletingPromo.id);
      showMessage(`Промокод "${deletingPromo.code}" удалён`, 'success');
    } catch {
      showMessage('Ошибка при удалении', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingPromo(null);
    }
  };

  // Sort by newest first
  const sortedCodes = useMemo(() => {
    return [...promoCodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [promoCodes]);

  // ==================== Render ====================

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка загрузки промокодов: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Промокоды
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление промокодами и скидками
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Создать промокод
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {isLoading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Всего: {sortedCodes.length} промокодов
              </Typography>

              {/* Desktop table (hidden on mobile) */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Код</TableCell>
                        <TableCell>Тип</TableCell>
                        <TableCell>Значение</TableCell>
                        <TableCell>Мин. сумма</TableCell>
                        <TableCell>Использований</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Действует до</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedCodes.map((promo) => (
                        <PromoCodeTableRow
                          key={promo.id}
                          promo={promo}
                          theme={theme}
                          copiedId={copiedId}
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                          onCopy={handleCopyCode}
                        />
                      ))}
                      {sortedCodes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                            <PromoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary">
                              Промокодов пока нет
                            </Typography>
                            <Button
                              startIcon={<AddIcon />}
                              sx={{ mt: 2 }}
                              onClick={handleCreate}
                            >
                              Создать первый промокод
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Mobile cards (hidden on desktop) */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {sortedCodes.map((promo) => (
                  <PromoCodeCard
                    key={promo.id}
                    promo={promo}
                    theme={theme}
                    copiedId={copiedId}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onCopy={handleCopyCode}
                  />
                ))}
                {sortedCodes.length === 0 && (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <PromoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      Промокодов пока нет
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                      onClick={handleCreate}
                    >
                      Создать первый промокод
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <PromoCodeDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        promo={editingPromo}
        onSave={handleSave}
        loading={createPromo.isPending || updatePromo.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить промокод?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить промокод{' '}
            <strong>&quot;{deletingPromo?.code}&quot;</strong>? Это действие нельзя отменить.
          </Typography>
          {deletingPromo && deletingPromo.currentUses > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Этот промокод уже использован {deletingPromo.currentUses} раз(а).
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deletePromo.isPending}
            startIcon={deletePromo.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ==================== Desktop Table Row ====================

const PromoCodeTableRow: React.FC<{
  promo: PromoCode;
  theme: ReturnType<typeof useTheme>;
  copiedId: number | null;
  onEdit: (promo: PromoCode) => void;
  onDelete: (promo: PromoCode) => void;
  onCopy: (code: string, id: number) => void;
}> = ({ promo, theme, copiedId, onEdit, onDelete, onCopy }) => {
  const expired = isExpired(promo.validUntil);
  const statusLabel = !promo.isActive
    ? 'Неактивен'
    : expired
      ? 'Истёк'
      : 'Активен';
  const statusColor = !promo.isActive
    ? 'default'
    : expired
      ? 'warning'
      : 'success';

  return (
    <TableRow
      hover
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      {/* Code */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: 0.5,
              bgcolor:
                theme.palette.mode === 'light'
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.primary.main, 0.15),
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {promo.code}
          </Typography>
          <Tooltip title={copiedId === promo.id ? 'Скопировано!' : 'Копировать'}>
            <IconButton
              size="small"
              onClick={() => onCopy(promo.code, promo.id)}
              color={copiedId === promo.id ? 'success' : 'default'}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>

      {/* Discount Type */}
      <TableCell>
        <Chip
          size="small"
          icon={promo.discountType === 'percent' ? <PercentIcon /> : <MoneyIcon />}
          label={promo.discountType === 'percent' ? 'Процент' : 'Фиксированная'}
          variant="outlined"
        />
      </TableCell>

      {/* Value */}
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {promo.discountType === 'percent'
            ? `${promo.discountValue}%`
            : `${promo.discountValue} ₽`}
        </Typography>
        {promo.maxDiscountAmount != null && promo.maxDiscountAmount > 0 && (
          <Typography variant="caption" color="text.secondary">
            макс. {promo.maxDiscountAmount} ₽
          </Typography>
        )}
      </TableCell>

      {/* Min order */}
      <TableCell>
        <Typography variant="body2">
          {promo.minOrderAmount > 0 ? `${promo.minOrderAmount} ₽` : '—'}
        </Typography>
      </TableCell>

      {/* Uses */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color:
              promo.maxUses != null && promo.maxUses > 0 && promo.currentUses >= promo.maxUses
                ? 'error.main'
                : 'text.primary',
            fontWeight: promo.maxUses != null && promo.maxUses > 0 && promo.currentUses >= promo.maxUses ? 600 : 400,
          }}
        >
          {promo.currentUses}
          {promo.maxUses != null && promo.maxUses > 0 ? ` / ${promo.maxUses}` : ''}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Chip
          size="small"
          label={statusLabel}
          color={statusColor as any}
          variant={!promo.isActive || expired ? 'outlined' : 'filled'}
        />
      </TableCell>

      {/* Valid Until */}
      <TableCell>
        <Typography variant="body2">{formatDate(promo.validUntil)}</Typography>
      </TableCell>

      {/* Actions */}
      <TableCell align="right">
        <Tooltip title="Редактировать">
          <IconButton size="small" color="primary" onClick={() => onEdit(promo)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" color="error" onClick={() => onDelete(promo)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

// ==================== Mobile Card ====================

const PromoCodeCard: React.FC<{
  promo: PromoCode;
  theme: ReturnType<typeof useTheme>;
  copiedId: number | null;
  onEdit: (promo: PromoCode) => void;
  onDelete: (promo: PromoCode) => void;
  onCopy: (code: string, id: number) => void;
}> = ({ promo, theme, copiedId, onEdit, onDelete, onCopy }) => {
  const expired = isExpired(promo.validUntil);
  const statusLabel = !promo.isActive
    ? 'Неактивен'
    : expired
      ? 'Истёк'
      : 'Активен';
  const statusColor = !promo.isActive
    ? 'default'
    : expired
      ? 'warning'
      : 'success';

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        bgcolor:
          !promo.isActive
            ? alpha(theme.palette.text.disabled, 0.03)
            : undefined,
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Top row: code + status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: 0.5,
                bgcolor:
                  theme.palette.mode === 'light'
                    ? alpha(theme.palette.primary.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.15),
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {promo.code}
            </Typography>
            <Tooltip title={copiedId === promo.id ? 'Скопировано!' : 'Копировать'}>
              <IconButton
                size="small"
                onClick={() => onCopy(promo.code, promo.id)}
                color={copiedId === promo.id ? 'success' : 'default'}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Chip
            size="small"
            label={statusLabel}
            color={statusColor as any}
            variant={!promo.isActive || expired ? 'outlined' : 'filled'}
          />
        </Box>

        {/* Discount info */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={600}>
            {promo.discountType === 'percent'
              ? `${promo.discountValue}% скидка`
              : `Скидка ${promo.discountValue} ₽`}
          </Typography>
          <Chip
            size="small"
            icon={promo.discountType === 'percent' ? <PercentIcon /> : <MoneyIcon />}
            label={promo.discountType === 'percent' ? 'Процент' : 'Фиксированная'}
            variant="outlined"
          />
        </Box>

        {/* Details grid */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Мин. сумма:
            </Typography>
            <Typography variant="body2">
              {promo.minOrderAmount > 0 ? `${promo.minOrderAmount} ₽` : '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Использований:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color:
                  promo.maxUses != null && promo.maxUses > 0 && promo.currentUses >= promo.maxUses
                    ? 'error.main'
                    : 'text.primary',
              }}
            >
              {promo.currentUses}
              {promo.maxUses != null && promo.maxUses > 0 ? ` / ${promo.maxUses}` : ' (без лимита)'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Макс. скидка:
            </Typography>
            <Typography variant="body2">
              {promo.maxDiscountAmount != null && promo.maxDiscountAmount > 0
                ? `${promo.maxDiscountAmount} ₽`
                : '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Действует до:
            </Typography>
            <Typography variant="body2">{formatDate(promo.validUntil)}</Typography>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={() => onEdit(promo)}
          >
            Редактировать
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            color="error"
            variant="outlined"
            onClick={() => onDelete(promo)}
          >
            Удалить
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// ==================== Create/Edit Dialog ====================

const PromoCodeDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  promo: PromoCode | null;
  onSave: (data: PromoCodeFormData) => void;
  loading: boolean;
}> = ({ open, onClose, promo, onSave, loading }) => {
  const [form, setForm] = useState<PromoCodeFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof PromoCodeFormData, string>>>({});

  React.useEffect(() => {
    if (promo) {
      setForm(promoToForm(promo));
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [promo, open]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.code.trim()) newErrors.code = 'Введите код промокода';
    if (form.discountValue <= 0) newErrors.discountValue = 'Значение должно быть больше 0';
    if (form.discountType === 'percent' && form.discountValue > 100)
      newErrors.discountValue = 'Процент не может быть больше 100';
    if (form.validFrom && form.validUntil && form.validFrom >= form.validUntil)
      newErrors.validUntil = 'Дата окончания должна быть позже даты начала';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  const setField = <K extends keyof PromoCodeFormData>(key: K, value: PromoCodeFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{promo ? 'Редактировать промокод' : 'Новый промокод'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* Code */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Код промокода"
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                placeholder="Например: SALE2024"
                error={!!errors.code}
                helperText={errors.code || 'Код будет автоматически приведён к верхнему регистру'}
                inputProps={{ sx: { fontFamily: 'monospace', letterSpacing: 1 } }}
              />
            </Grid>

            {/* Discount Type */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Тип скидки</InputLabel>
                <Select
                  value={form.discountType}
                  label="Тип скидки"
                  onChange={(e) => setField('discountType', e.target.value as 'percent' | 'fixed')}
                >
                  <MenuItem value="percent">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PercentIcon fontSize="small" color="action" />
                      Процент
                    </Box>
                  </MenuItem>
                  <MenuItem value="fixed">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon fontSize="small" color="action" />
                      Фиксированная сумма (₽)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Discount Value */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label={form.discountType === 'percent' ? 'Размер скидки (%)' : 'Размер скидки (₽)'}
                value={form.discountValue}
                onChange={(e) => setField('discountValue', parseFloat(e.target.value) || 0)}
                error={!!errors.discountValue}
                helperText={errors.discountValue}
                inputProps={{
                  min: 0,
                  max: form.discountType === 'percent' ? 100 : undefined,
                  step: form.discountType === 'fixed' ? 1 : 1,
                }}
              />
            </Grid>

            {/* Max Discount Amount (only for percent type) */}
            {form.discountType === 'percent' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Макс. скидка (₽)"
                  value={form.maxDiscountAmount}
                  onChange={(e) => setField('maxDiscountAmount', parseFloat(e.target.value) || 0)}
                  helperText="Максимальная сумма скидки в рублях. 0 = без лимита"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            )}

            {/* Min Order Amount */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Мин. сумма заказа (₽)"
                value={form.minOrderAmount}
                onChange={(e) => setField('minOrderAmount', parseFloat(e.target.value) || 0)}
                helperText="0 = без ограничения"
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Max Uses */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Макс. использований"
                value={form.maxUses}
                onChange={(e) => setField('maxUses', parseInt(e.target.value) || 0)}
                helperText="0 = без лимита"
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Valid From */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Действует с"
                value={form.validFrom}
                onChange={(e) => setField('validFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Valid Until */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Действует до"
                value={form.validUntil}
                onChange={(e) => setField('validUntil', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.validUntil}
                helperText={errors.validUntil}
              />
            </Grid>

            {/* Active Switch */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Typography>
                    {form.isActive ? 'Активен' : 'Неактивен'}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Сохранение...' : promo ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminPromoCodesPage;
