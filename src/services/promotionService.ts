import api from './apiClient';
import type { Promotion } from '../types/Promotion';

class PromotionService {
  private readonly BASE_URL = '/promotions';

  async getByCode(code: string): Promise<Promotion | null> {
    try {
      const response = await api.get(`${this.BASE_URL}/code/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching promotion:', error);
      return null;
    }
  }

  async validatePromotion(code: string, amount: number): Promise<boolean> {
    try {
      const response = await api.post(`${this.BASE_URL}/validate`, { 
        code, 
        amount 
      });
      return response.data.valid;
    } catch (error) {
      console.error('Error validating promotion:', error);
      return false;
    }
  }

  async getActivePromotions(): Promise<Promotion[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      return [];
    }
  }
}

export const promotionService = new PromotionService();
export default promotionService;
