import api from './apiClient';
import type { PaymentMethod, CreatePaymentMethod } from '../types/PaymentMethod';

class PaymentMethodService {
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    try {
      const response = await api.get(`/users/${userId}/payment-methods`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async createPaymentMethod(userId: number, data: CreatePaymentMethod): Promise<PaymentMethod | null> {
    try {
      const response = await api.post(`/users/${userId}/payment-methods`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment method:', error);
      return null;
    }
  }

  async deletePaymentMethod(userId: number, paymentMethodId: number): Promise<boolean> {
    try {
      await api.delete(`/users/${userId}/payment-methods/${paymentMethodId}`);
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<boolean> {
    try {
      await api.patch(`/users/${userId}/payment-methods/${paymentMethodId}/default`);
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  async updatePaymentMethod(userId: number, paymentMethodId: number, data: Partial<CreatePaymentMethod>): Promise<PaymentMethod | null> {
    try {
      const response = await api.put(`/users/${userId}/payment-methods/${paymentMethodId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      return null;
    }
  }
}

export const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;
