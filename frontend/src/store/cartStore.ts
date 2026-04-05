import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shawarma, CartItem, SelectedAddon } from '../types';

// Функция для создания уникального ключа на основе выбранных добавок
const generateUniqueKey = (id: number, selectedAddons: SelectedAddon[]): string => {
  if (!selectedAddons || selectedAddons.length === 0) return `item-${id}-no-addons`;
  
  // Сортируем по ID добавки для консистентности
  const sorted = [...selectedAddons].sort((a, b) => a.addonId - b.addonId);
  const addonsPart = sorted.map(a => `${a.addonId}:${a.quantity}`).join('|');
  return `item-${id}-${addonsPart}`;
};

interface CartStore {
  items: CartItem[];
  
  // Добавление товара с добавками
  addItem: (product: Shawarma, quantity: number, selectedAddons: SelectedAddon[], instructions?: string) => void;
  
  // Удаление товара
  removeItem: (uniqueKey: string) => void;
  
  // Изменение количества
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  
  // Обновление инструкций
  updateInstructions: (uniqueKey: string, instructions: string) => void;
  
  // Очистка корзины
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, selectedAddons, instructions = '') => {
        const items = get().items;
        const uniqueKey = generateUniqueKey(product.id, selectedAddons);
        
        // Ищем существующую позицию с таким же ключом
        const existingIndex = items.findIndex(item => item.uniqueKey === uniqueKey);
        
        if (existingIndex >= 0) {
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
            specialInstructions: instructions || updatedItems[existingIndex].specialInstructions
          };
          set({ items: updatedItems });
        } else {
          const newItem: CartItem = {
            ...product,
            quantity,
            selectedAddons,
            specialInstructions: instructions,
            uniqueKey
          };
          set({ items: [...items, newItem] });
        }
      },
      
      removeItem: (uniqueKey) => {
        set({ 
          items: get().items.filter(item => item.uniqueKey !== uniqueKey) 
        });
      },
      
      updateQuantity: (uniqueKey, quantity) => {
        if (quantity < 1) {
          get().removeItem(uniqueKey);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.uniqueKey === uniqueKey ? { ...item, quantity } : item
          )
        });
      },
      
      updateInstructions: (uniqueKey, instructions) => {
        set({
          items: get().items.map(item =>
            item.uniqueKey === uniqueKey ? { ...item, specialInstructions: instructions } : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Селекторы для вычисляемых значений
export const useTotalItems = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useTotalPrice = () => {
  const items = useCartStore(state => state.items);
  return Math.round(items.reduce((sum, item) => {
    const basePrice = item.price;
    const addonsPrice = item.selectedAddons?.reduce((s, a) => s + a.price * a.quantity, 0) || 0;
    return sum + (basePrice + addonsPrice) * item.quantity;
  }, 0));
};
