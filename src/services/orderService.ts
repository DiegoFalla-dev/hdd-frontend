import api from './apiClient';
import type { CreateOrderRequest, Order, OrderItem } from '../types/Order';

class OrderService {
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const response = await api.post('/orders', request);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<Order> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async applyPromotion(orderId: number, promotionCode: string): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/apply-promotion`, { promotionCode });
      return response.data;
    } catch (error) {
      console.error('Error applying promotion:', error);
      throw error;
    }
  }

  async removePromotion(orderId: number): Promise<Order> {
    try {
      const response = await api.post(`/orders/${orderId}/remove-promotion`);
      return response.data;
    } catch (error) {
      console.error('Error removing promotion:', error);
      throw error;
    }
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    try {
      const response = await api.get(`/orders/${orderId}/items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    const response = await api.get(`/users/${userId}/orders`);
    return response.data;
  }

  async getTicketPdf(itemId: number): Promise<Blob> {
    const response = await api.get(`/orders/items/${itemId}/ticket-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async cancelOrder(orderId: number): Promise<void> {
    await api.post(`/orders/${orderId}/cancel`);
  }

  async validateSeats(showtimeId: number, seats: number[]): Promise<boolean> {
    const response = await api.post(`/showtimes/${showtimeId}/validate-seats`, { seats });
    return response.data.valid;
  }

  async reserveSeats(showtimeId: number, seats: number[]): Promise<void> {
    await api.post(`/showtimes/${showtimeId}/reserve-seats`, { seats });
  }

  async releaseSeats(showtimeId: number, seats: number[]): Promise<void> {
    await api.post(`/showtimes/${showtimeId}/release-seats`, { seats });
  }
}

export const orderService = new OrderService();
export default orderService;
