import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeliveryType = 'Доставка' | 'Самовывоз' | 'В зале';

interface OrderFlowState {
  cartOpen: boolean;
  orderOpen: boolean;
  deliveryType: DeliveryType;
  address: string;
  customerName: string;
  phone: string;
  openCart: () => void;
  closeCart: () => void;
  openOrder: () => void;
  closeOrder: () => void;
  proceedToCheckout: () => void;
  backToCart: () => void;
  setDeliveryType: (type: DeliveryType) => void;
  setAddress: (address: string) => void;
  setCustomerName: (name: string) => void;
  setPhone: (phone: string) => void;
}

export const useOrderFlowStore = create<OrderFlowState>()(
  persist(
    (set) => ({
      cartOpen: false,
      orderOpen: false,
      deliveryType: 'Доставка',
      address: '',
      customerName: '',
      phone: '',
      openCart: () => set({ cartOpen: true }),
      closeCart: () => set({ cartOpen: false }),
      openOrder: () => set({ orderOpen: true }),
      closeOrder: () => set({ orderOpen: false }),
      proceedToCheckout: () => set({ cartOpen: false, orderOpen: true }),
      backToCart: () => set({ orderOpen: false, cartOpen: true }),
      setDeliveryType: (deliveryType) => set({ deliveryType }),
      setAddress: (address) => set({ address }),
      setCustomerName: (name) => set({ customerName: name }),
      setPhone: (phone) => set({ phone }),
    }),
    {
      name: 'order-flow-storage',
      partialize: (state) => ({
        deliveryType: state.deliveryType,
        address: state.address,
        customerName: state.customerName,
        phone: state.phone,
      }),
    }
  )
);
