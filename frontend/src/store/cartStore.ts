import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shawarma } from '../types';

// Тип для товара в корзине (расширяем Shawarma полем quantity)
export interface CartItem extends Shawarma {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  
  // Добавление товара
  addItem: (product: Shawarma, quantity: number) => void;
  
  // Удаление товара
  removeItem: (id: number) => void;
  
  // Изменение количества
  updateQuantity: (id: number, quantity: number) => void;
  
  // Очистка корзины
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity) => {
        const items = get().items;
        const existing = items.find(item => item.id === product.id);
        
        if (existing) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          const newItem: CartItem = {
            ...product,
            quantity
          };
          set({ items: [...items, newItem] });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
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

// 👇 Селекторы для вычисляемых значений (вынесены отдельно)
export const useTotalItems = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useTotalPrice = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};