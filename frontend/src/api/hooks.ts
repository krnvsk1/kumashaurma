import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { 
  Shawarma, 
  CreateShawarmaDto,
  Order, 
  CreateOrderDto, 
  UpdateOrderStatusDto,
  HealthStatus,
  DashboardStats 
} from '../types';

// ==================== SHAWARMA HOOKS ====================

export const useShawarmas = () => {
  return useQuery<Shawarma[]>({
    queryKey: ['shawarmas'],
    queryFn: () => apiClient.get('/shawarma').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useShawarma = (id: number) => {
  return useQuery<Shawarma>({
    queryKey: ['shawarma', id],
    queryFn: () => apiClient.get(`/shawarma/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreateShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<Shawarma, Error, CreateShawarmaDto>({
    mutationFn: (data) => apiClient.post('/shawarma', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

export const useUpdateShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<Shawarma, Error, Partial<Shawarma> & { id: number }>({
    mutationFn: ({ id, ...data }) => 
      apiClient.put(`/shawarma/${id}`, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
      queryClient.invalidateQueries({ queryKey: ['shawarma', variables.id] });
    },
  });
};

export const useDeleteShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => apiClient.delete(`/shawarma/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// ==================== ORDER HOOKS ====================

export const useOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/orders').then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
};

export const useOrder = (id: number) => {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, CreateOrderDto>({
    mutationFn: (data) => apiClient.post('/orders', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { id: number; status: UpdateOrderStatusDto }>({
    mutationFn: ({ id, status }) => 
      apiClient.patch(`/orders/${id}/status`, status).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
};

// ==================== DASHBOARD HOOKS ====================

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard/stats').then(res => res.data),
    staleTime: 60 * 1000,
  });
};

// ==================== HEALTH HOOK ====================

export const useHealth = () => {
  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health').then(res => res.data),
    refetchInterval: 30 * 1000,
  });
};