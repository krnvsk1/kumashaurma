// src/types/index.ts

// ==================== SHAWARMA (Меню) ====================

export interface Shawarma {
  id: number;
  name: string;
  price: number;
  displayPrice?: number;
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
  variants?: ProductVariant[];
}

  export interface ShawarmaImage {
    id: number;
    shawarmaId: number;
    filePath: string;
    isPrimary: boolean;
    createdAt: string;
  }

  export interface ProductVariant {
    id: number;
    shawarmaId: number;
    name: string;
    price: number;
    sortOrder: number;
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
    variants?: { name: string; price: number }[];
  };

  export interface CartItem extends Shawarma {
    quantity: number;
    selectedAddons: SelectedAddon[];
    selectedVariant?: ProductVariant;
    specialInstructions?: string;
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
    userId?: number | null;     // ID пользователя, если авторизован
    customerName: string;
    phone: string;
    address: string;
    total: number;
    status: OrderStatus;
    notes: string | null;       // Может быть null
    createdAt: string;          // ISO date
    completedAt: string | null; // Может быть null
    orderItems: OrderItem[];    // Связь с элементами заказа
    deliveryType?: string;
    discountAmount?: number;
    promoCodeId?: number | null;
  }
  
  // Для создания заказа (то, что отправляем на бэкенд)
  export interface CreateOrderDto {
    customerName: string;
    phone: string;
    address: string;
    notes?: string | null;      // опционально
    deliveryType?: string;
    promoCodeId?: number | null;
    items: {
      shawarmaId: number;
      quantity: number;
      name?: string;            // опционально, бэкенд сам подставит
      price?: number;
      selectedAddons?: {
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

  // ==================== USERS (Пользователи) ====================

  export type UserRole = 'user' | 'admin' | 'manager' | 'courier';

  export interface User {
    id: number;
    phone: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneVerified: boolean;
    roles: string[];
    createdAt?: string;
  }

  export interface UserDetail extends User {
    addresses: UserAddress[];
  }

  export interface UserAddress {
    id: number;
    address: string;
    entrance?: string | null;
    floor?: string | null;
    apartment?: string | null;
    comment?: string | null;
    isDefault: boolean;
  }

  export interface AssignRoleDto {
    role: UserRole;
  }

  export interface UsersQueryParams {
    role?: UserRole;
    page?: number;
    pageSize?: number;
  }

  // ==================== PROMO CODES (Промокоды) ====================

  export interface PromoCodeValidation {
    valid: boolean;
    message: string;
    promoCodeId?: number | null;
    code?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
  }

  export interface PromoCode {
    id: number;
    code: string;
    discountType: string; // "percent" or "fixed"
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number | null;
    maxUses?: number | null;
    currentUses: number;
    validFrom?: string | null;
    validUntil?: string | null;
    isActive: boolean;
    createdBy?: number | null;
    createdAt: string;
  }