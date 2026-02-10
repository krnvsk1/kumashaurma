import axios from 'axios';

const API_URL = 'http://localhost:5199/api';

export interface Order {
  id: number;
  name: string;
  price: number;
  description: string | null;
  createdAt: string;
  isCompleted: boolean;
}

export interface CreateOrderRequest {
  name: string;
  price: number;
  description?: string;
}

class OrderService {
  private api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Получить все заказы
  async getAllOrders(): Promise<Order[]> {
    const response = await this.api.get<Order[]>('/direct');
    return response.data;
  }

  // Получить заказ по ID
  async getOrderById(id: number): Promise<Order> {
    const response = await this.api.get<Order>(`/direct/${id}`);
    return response.data;
  }

  // Создать новый заказ
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    const response = await this.api.post<Order>('/direct', order);
    return response.data;
  }

  // Удалить заказ
  async deleteOrder(id: number): Promise<void> {
    await this.api.delete(`/direct/${id}`);
  }

  // Обновить заказ
  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    const response = await this.api.put<Order>(`/direct/${id}`, order);
    return response.data;
  }

  // Проверить статус БД
  async checkDbStatus(): Promise<any> {
    const response = await this.api.get('/db/status');
    return response.data;
  }
}

export const orderService = new OrderService();
