import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shawarma, CartItem, SelectedAddon } from '../types';

// Уникальный ключ: учитывает id родителя + id выбранного ребёнка + добавки
const generateUniqueKey = (
  productId: number,
  selectedAddons: SelectedAddon[],
  selectedChildId?: number
): string => {
  const childPart = selectedChildId ? `c${selectedChildId}` : 'no-child';
  if (!selectedAddons || selectedAddons.length === 0) {
    return `item-${productId}-${childPart}-no-addons`;
  }

  const sorted = [...selectedAddons].sort((a, b) => a.addonId - b.addonId);
  const addonsPart = sorted.map(a => `${a.addonId}:${a.quantity}`).join('|');
  return `item-${productId}-${childPart}-${addonsPart}`;
};

interface CartStore {
  items: CartItem[];

  // Добавление товара с добавками и выбранным вариантом-ребёнком
  addItem: (
    product: Shawarma,
    quantity: number,
    selectedAddons: SelectedAddon[],
    instructions?: string,
    selectedChild?: Shawarma
  ) => void;

  removeItem: (uniqueKey: string) => void;
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  updateInstructions: (uniqueKey: string, instructions: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, selectedAddons, instructions = '', selectedChild) => {
        const items = get().items;
        const uniqueKey = generateUniqueKey(product.id, selectedAddons, selectedChild?.id);

        const existingIndex = items.findIndex(item => item.uniqueKey === uniqueKey);

        if (existingIndex >= 0) {
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
            specialInstructions: instructions || updatedItems[existingIndex].specialInstructions,
          };
          set({ items: updatedItems });
        } else {
          const newItem: CartItem = {
            ...product,
            quantity,
            selectedAddons,
            specialInstructions: instructions,
            uniqueKey,
            selectedChild,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (uniqueKey) => {
        set({
          items: get().items.filter(item => item.uniqueKey !== uniqueKey),
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
          ),
        });
      },

      updateInstructions: (uniqueKey, instructions) => {
        set({
          items: get().items.map(item =>
            item.uniqueKey === uniqueKey ? { ...item, specialInstructions: instructions } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);

export const useTotalItems = () => {
  const items = useCartStore(state => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useTotalPrice = () => {
  const items = useCartStore(state => state.items);
  return Math.round(items.reduce((sum, item) => {
    // Если выбран дочерний вариант — берём его цену, иначе цену родителя
    const basePrice = item.selectedChild?.price ?? item.price;
    const addonsPrice = item.selectedAddons?.reduce((s, a) => s + a.price * a.quantity, 0) || 0;
    return sum + (basePrice + addonsPrice) * item.quantity;
  }, 0));
};
