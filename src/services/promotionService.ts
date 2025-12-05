import api from './apiClient';
import type { Promotion } from '../types/Promotion';

// Se asume endpoint de validación: GET /promotions/validate?code=XYZ
// Ajustar si backend difiere (e.g. POST /promotions/validate)

export async function validatePromotion(code: string): Promise<Promotion> {
  if (!code.trim()) throw new Error('Código vacío');
  const resp = await api.get<Promotion>(`/promotions/validate`, { params: { code } });
  return resp.data;
}

export default { validatePromotion };
