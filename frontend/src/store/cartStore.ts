import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shawarma, CartItem, SelectedAddon } from '../types';

interface CartStore {
  items: CartItem[];
  
  // Добавление товара с добавками
  addItem: (product: Shawarma, quantity: number, selectedAddons: SelectedAddon[], instructions?: string) => void;
  
  // Удаление товара
  removeItem: (uniqueId: string) => void;
  
  // Изменение количества
  updateQuantity: (uniqueId: string, quantity: number) => void;
  
  // Обновление инструкций
  updateInstructions: (uniqueId: string, instructions: string) => void;
  
  // Очистка корзины
  clearCart: () => void;
  
  // Получение уникального идентификатора для позиции
  getItemUniqueId: (item: CartItem) => string;
}

// Функция для создания уникального ID позиции на основе товара и выбранных добавок
const createUniqueId = (item: Partial<CartItem>): string => {
  const addonsKey = item.selectedAddons
    ?.map(a => `${a.addonId}:${a.quantity}`)
    .sort()
    .join('|') || 'no-addons';
  
  return `${item.id}-${addonsKey}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, selectedAddons, instructions = '') => {
        const items = get().items;
        
        // Создаем временный объект для генерации ID
        const tempItem: Partial<CartItem> = {
          id: product.id,
          selectedAddons
        };
        
        const uniqueId = createUniqueId(tempItem);
        
        // Проверяем, есть ли уже такая позиция
        const existingIndex = items.findIndex(item => 
          get().getItemUniqueId(item) === uniqueId
        );
        
        if (existingIndex >= 0) {
          // Обновляем существующую позицию
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
            specialInstructions: instructions || updatedItems[existingIndex].specialInstructions
          };
          set({ items: updatedItems });
        } else {
          // Добавляем новую позицию
          const newItem: CartItem = {
            ...product,
            quantity,
            selectedAddons,
            specialInstructions: instructions,
            uniqueId
          };
          set({ items: [...items, newItem] });
        }
      },
      
      removeItem: (uniqueId) => {
        set({ 
          items: get().items.filter(item => get().getItemUniqueId(item) !== uniqueId) 
        });
      },
      
      updateQuantity: (uniqueId, quantity) => {
        if (quantity < 1) {
          get().removeItem(uniqueId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            get().getItemUniqueId(item) === uniqueId 
              ? { ...item, quantity } 
              : item
          )
        });
      },
      
      updateInstructions: (uniqueId, instructions) => {
        set({
          items: get().items.map(item =>
            get().getItemUniqueId(item) === uniqueId 
              ? { ...item, specialInstructions: instructions } 
              : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getItemUniqueId: (item) => {
        return item.uniqueId || createUniqueId(item);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);

// 👇 Селекторы для вычисляемых значений
export const useTotalItems = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useTotalPrice = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => {
    const addonsPrice = item.selectedAddons?.reduce((s, a) => s + a.price * a.quantity, 0) || 0;
    return sum + (item.price + addonsPrice) * item.quantity;
  }, 0);
};

export const useCartItemsCount = () => {
  return useCartStore(state => state.items.length);
};