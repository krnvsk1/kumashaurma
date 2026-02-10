import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Shawarma hooks
export const useShawarmas = () => {
  return useQuery({
    queryKey: ['shawarmas'],
    queryFn: () => apiClient.get('/shawarma').then(res => res.data),
  });
};

export const useCreateShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/shawarma', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/orders').then(res => res.data),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Health check
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health').then(res => res.data),
    refetchInterval: 30000, // проверка каждые 30 секунд
  });
};
