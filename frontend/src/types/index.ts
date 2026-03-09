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
  isPromo?: boolean;
  createdAt: string;
  updatedAt?: string | null;
  images?: ShawarmaImage[];
  primaryImage?: string;
  sortOrder?: number;
  addonCategories?: AddonCategory[];
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

  export interface CartItem extends Shawarma {
    quantity: number;
    selectedAddons: SelectedAddon[]; // 👈 НОВОЕ
    specialInstructions?: string; // 👈 НОВОЕ
    uniqueKey?: string;
  }
  
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
    selectedAddons?: OrderItemAddon[];
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
      price?: number;
      selectedAddons?: {              // 👈 НОВОЕ
        addonId: number;
        quantity: number;
      }[];
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

  // Статистика заказов с бэкенда (GET /api/orders/stats)
  export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    todayOrders: number;
    averageOrderValue: number;
  }

  // DTO для обновления заказа (PUT /api/orders/{id})
  export interface UpdateOrderDto {
    status?: OrderStatus;
    total?: number;
    customerName?: string;
    phone?: string;
    address?: string;
    notes?: string | null;
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

  // ==================== ADDONS (Добавки) ====================

  export interface AddonCategory {
    id: number;
    name: string;
    description?: string | null;
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    addons: Addon[];
  }

  export interface Addon {
    maxQuantity?: number;
    id: number;
    name: string;
    description?: string | null;
    price: number;
    isAvailable: boolean;
    addonCategoryId: number;  // Добавьте это поле
    displayOrder?: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface SelectedAddon {
    addonId: number;
    addonName: string;
    price: number;
    quantity: number;
    categoryId: number;
    categoryName: string;
  }

  export interface OrderItemAddon {
    id: number;
    orderItemId: number;
    addonId: number;
    addonName: string;
    addonCategoryId: number;
    addonCategoryName: string;
    price: number;
    quantity: number;
  }