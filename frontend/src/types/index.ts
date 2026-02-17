// src/types/index.ts

// ==================== SHAWARMA (Меню) ====================

export interface Shawarma {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  isSpicy: boolean;
  hasCheese: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string | null;
  images?: ShawarmaImage[];  // 👈 добавить
  primaryImage?: string;      // 👈 добавить (для быстрого доступа)
}

  export interface ShawarmaImage {
    id: number;
    shawarmaId: number;
    filePath: string;
    isPrimary: boolean;
    createdAt: string;
  }
  
  // Для создания (все обязательные поля, без автогенерируемых)
  export interface CreateShawarmaDto {
    name: string;
    price: number;
    description: string;
    category?: string;          // опционально, на бэке дефолт "Курица"
    isSpicy?: boolean;
    hasCheese?: boolean;
    isAvailable?: boolean;
  };
  
  // Для обновления (все опционально, кроме id)
  export type UpdateShawarmaDto = Partial<CreateShawarmaDto> & { id: number };
  
  // ==================== ORDER (Заказы) ====================
  
  export type OrderStatus = 'Новый' | 'Готовится' | 'Готов' | 'Доставлен' | 'Отменён';
  
  export interface OrderItem {
    id: number;
    orderId: number;
    shawarmaId: number;
    name: string;               // Название на момент заказа
    quantity: number;
    price: number;              // Цена на момент заказа
    subtotal: number;           // Вычисляемое поле Price * Quantity
  }
  
  export interface Order {
    id: number;
    customerName: string;
    phone: string;
    address: string;
    total: number;
    status: OrderStatus;
    notes: string | null;       // Может быть null
    createdAt: string;          // ISO date
    completedAt: string | null; // Может быть null
    orderItems: OrderItem[];    // Связь с элементами заказа
  }
  
  // Для создания заказа (то, что отправляем на бэкенд)
  export interface CreateOrderDto {
    customerName: string;
    phone: string;
    address: string;
    notes?: string | null;      // опционально
    items: {
      shawarmaId: number;
      quantity: number;
      name?: string;            // опционально, бэкенд сам подставит
      price?: number;           // опционально, бэкенд сам подставит
    }[];
  }
  
  // Для обновления статуса
  export interface UpdateOrderStatusDto {
    status: OrderStatus;
  }
  
  // ==================== DASHBOARD (если понадобится) ====================
  
  export interface DashboardStats {
    totalOrdersToday: number;
    totalRevenueToday: number;
    popularItems: {
      shawarmaId: number;
      shawarmaName: string;
      quantity: number;
    }[];
    ordersByStatus: {
      status: OrderStatus;
      count: number;
    }[];
  }
  
  // ==================== HEALTH (проверка API) ====================
  
  export interface HealthStatus {
    status: string;  // на бэке может быть любой формат
    // добавьте поля, которые реально приходят с /health
  }
  
  // ==================== API RESPONSE (если бэкенд оборачивает ответы) ====================
  
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
  }