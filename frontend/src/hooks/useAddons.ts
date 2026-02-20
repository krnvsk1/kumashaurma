import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AddonCategory, Addon } from '../types';

// ==================== GET HOOKS ====================

export const useAddonCategories = () => {
  return useQuery<AddonCategory[]>({
    queryKey: ['addon-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/addons/categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useShawarmaAddons = (shawarmaId?: number) => {
  return useQuery<AddonCategory[]>({
    queryKey: ['shawarma-addons', shawarmaId],
    queryFn: async () => {
      if (!shawarmaId) return [];
      const { data } = await apiClient.get(`/addons/shawarma/${shawarmaId}`);
      return data;
    },
    enabled: !!shawarmaId,
    staleTime: 5 * 60 * 1000,
  });
};

// ==================== MUTATION HOOKS (для админки) ====================

export const useCreateAddonCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AddonCategory>) => 
      apiClient.post('/addons/categories', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-categories'] });
    },
  });
};

export const useUpdateAddonCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<AddonCategory>) => 
      apiClient.put(`/addons/categories/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-categories'] });
    },
  });
};

// Добавьте этот интерфейс
export interface CreateAddonDto {
  name: string;
  description?: string | null;
  price: number;
  category: {  // 👈 объект с id
    id: number;
  };
  isAvailable?: boolean;
  displayOrder?: number;
}

export const useCreateAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAddonDto) => {
      console.log('📤 useAddons - отправка:', JSON.stringify(data, null, 2));
      const response = await apiClient.post('/addons', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-categories'] });
    },
  });
};

export const useUpdateAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Addon>) => 
      apiClient.put(`/addons/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-categories'] });
    },
  });
};

export const useDeleteAddon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/addons/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-categories'] });
    },
  });
};

export const useLinkAddonToShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { 
      shawarmaId: number; 
      addonId: number; 
      customPrice?: number;
      isDefault?: boolean;
      maxQuantity?: number;
    }) => apiClient.post('/addons/link-to-shawarma', data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarma-addons', variables.shawarmaId] });
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};

export const useUnlinkAddonFromShawarma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shawarmaId, addonId }: { shawarmaId: number; addonId: number }) => 
      apiClient.delete(`/addons/unlink-from-shawarma?shawarmaId=${shawarmaId}&addonId=${addonId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shawarma-addons', variables.shawarmaId] });
      queryClient.invalidateQueries({ queryKey: ['shawarmas'] });
    },
  });
};