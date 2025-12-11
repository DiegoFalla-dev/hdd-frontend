import api from './apiClient';
import type { Promotion } from '../types/Promotion';

export interface PromotionValidationResponse {
  isValid: boolean;
  promotion?: Promotion;
  message?: string;
  requiredAmount?: string;
}

/**
 * Valida una promoción contra un monto total.
 * @param code - Código de promoción
 * @param amount - Monto total a validar (en soles)
 * @returns Objeto con validación y detalles de la promoción
 */
export async function validatePromotion(code: string, amount: number): Promise<PromotionValidationResponse> {
  if (!code.trim()) {
    return { 
      isValid: false, 
      message: 'Código de promoción requerido' 
    };
  }

  try {
    const resp = await api.get<PromotionValidationResponse>('/promotions/validate', { 
      params: { 
        code, 
        amount: amount.toFixed(2) 
      } 
    });
    return resp.data;
  } catch (error) {
    return { 
      isValid: false, 
      message: 'Error validando promoción' 
    };
  }
}

export default { validatePromotion };
