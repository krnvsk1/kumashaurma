import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Shawarma hooks
export const useShawarmas = () => {
  return useQuery({
    queryKey: ['shawarmas'],
    queryFn: () => apiClient.get('/shawarma').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/orders').then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 минуты
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
    refetchInterval: 30 * 1000, // проверка каждые 30 секунд
  });
};
