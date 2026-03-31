import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { 
  Shawarma, 
  CreateShawarmaDto,
  Order, 
  CreateOrderDto, 
  UpdateOrderDto,
  UpdateOrderStatusDto,
  OrderStats,
  HealthStatus,
  DashboardStats,
  ShawarmaImage,
  User,
  UserDetail,
  AssignRoleDto,
  UsersQueryParams
} from '../types';

// ==================== SHAWARMA HOOKS ====================

export const useShawarmas = () => {
  return useQuery<Shawarma[]>({
    queryKey: ['shawarmas'],
    queryFn: () => apiClient.get('/api/shawarma').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useShawarma = (id: number) => {
  return useQuery<Shawarma>({
    queryKey: ['shawarma', id],
    queryFn: () => apiClient.get(`/api/shawarma/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreateShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<Shawarma, Error, CreateShawarmaDto>({
    mutationFn: (data) => apiClient.post('/api/shawarma', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

export const useUpdateShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<Shawarma, Error, Partial<Shawarma> & { id: number }>({
    mutationFn: ({ id, ...data }) => 
      apiClient.put(`/api/shawarma/${id}`, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
      queryClient.invalidateQueries({ queryKey: ['shawarma', variables.id] });
    },
  });
};

export const useDeleteShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiClient.delete(`/api/shawarma/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// 👇 Новый хук для обновления только доступности
export const useUpdateShawarmaAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      // Сначала получаем текущий товар
      const { data: shawarma } = await apiClient.get(`/api/shawarma/${id}`);
      // Обновляем только поле isAvailable
      const updated = { ...shawarma, isAvailable };
      await apiClient.put(`/api/shawarma/${id}`, updated);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
      queryClient.invalidateQueries({ queryKey: ['shawarma', variables.id] });
    },
  });
};

// 👇 Новый хук для обновления порядка сортировки
export const useUpdateShawarmaOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { id: number; sortOrder: number }[]) => {
      await apiClient.put('/api/shawarma/reorder', items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// ==================== CATEGORY HOOK ====================

export const useCategories = () => {
  return useQuery<string[]>({
    queryKey: ['shawarma-categories'],
    queryFn: () => apiClient.get('/api/shawarma/categories').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

// ==================== ORDER HOOKS ====================

// Все заказы (только для админов)
export const useOrders = (enabled = true) => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/api/orders').then(res => res.data),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
};

// Мои заказы (для обычных пользователей)
export const useMyOrders = (enabled = true) => {
  return useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: () => apiClient.get('/api/orders/my').then(res => res.data),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
};

export const useOrder = (id: number) => {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/api/orders/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, CreateOrderDto>({
    mutationFn: (data) => apiClient.post('/api/orders', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { id: number; status: UpdateOrderStatusDto }>({
    mutationFn: ({ id, status }) => 
      apiClient.patch(`/api/orders/${id}/status`, status).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};

// Полное обновление заказа
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { id: number; data: UpdateOrderDto }>({
    mutationFn: ({ id, data }) => 
      apiClient.put(`/api/orders/${id}`, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
};

// Удаление заказа
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; deletedId: number }, Error, number>({
    mutationFn: (id) => apiClient.delete(`/api/orders/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
};

// Статистика заказов
export const useOrderStats = () => {
  return useQuery<OrderStats>({
    queryKey: ['order-stats'],
    queryFn: () => apiClient.get('/api/orders/stats').then(res => res.data),
    staleTime: 60 * 1000,
  });
};

// ==================== DASHBOARD HOOKS ====================

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/api/dashboard/stats').then(res => res.data),
    staleTime: 60 * 1000,
  });
};

// ==================== HEALTH HOOK ====================

export const useHealth = () => {
  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/api/health').then(res => res.data),
    refetchInterval: 30 * 1000,
  });
};

// ==================== IMAGE HOOKS ====================

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ shawarmaId, file }: { shawarmaId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await apiClient.post(`/api/image/upload/${shawarmaId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarma', variables.shawarmaId] });
      queryClient.invalidateQueries({ queryKey: ['shawarma-images', variables.shawarmaId] });
    },
  });
};

export const useShawarmaImages = (shawarmaId: number) => {
  return useQuery({
    queryKey: ['shawarma-images', shawarmaId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/image/shawarma/${shawarmaId}`);
      return data as ShawarmaImage[];
    },
    enabled: !!shawarmaId,
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.delete(`/api/image/${imageId}`);
    },
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// 👇 Оставил, но он используется только в старом MenuPage
// Если везде убрали перетаскивание — можно удалить
export const useReorderShawarmas = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { id: number; order: number }[]) => {
      const response = await apiClient.put('/api/shawarma/reorder', items);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// ==================== USER HOOKS ====================

// Получить список пользователей
export const useUsers = (params?: UsersQueryParams) => {
  return useQuery<User[]>({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append('role', params.role);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
      const { data } = await apiClient.get(`/api/users?${queryParams.toString()}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Получить пользователя по ID
export const useUser = (id: number) => {
  return useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => apiClient.get(`/api/users/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

// Назначить роль пользователю
export const useAssignRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, { userId: number; role: AssignRoleDto }>({
    mutationFn: ({ userId, role }) => 
      apiClient.post(`/api/users/${userId}/roles`, role).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
};

// Удалить роль у пользователя
export const useRemoveRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string }, Error, { userId: number; role: string }>({
    mutationFn: ({ userId, role }) => 
      apiClient.delete(`/api/users/${userId}/roles/${role}`).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
};