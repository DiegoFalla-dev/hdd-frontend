import api from './apiClient';
import type { OrderPreview } from '../types/OrderPreview';
import type { OrderConfirmation } from '../types/OrderConfirmation';

// Resumen de compras para listado (historial)
export interface OrderSummary {
  id?: number; // si backend expone id interno
  purchaseNumber?: string; // número único tipo CIN-...
  movieTitle?: string;
  cinemaName?: string;
  showDate?: string; // YYYY-MM-DD
  showTime?: string; // HH:mm:ss
  format?: string;
  totalAmount?: number;
  status?: string; // COMPLETED, PENDING, FAILED, etc.
  purchaseDate?: string; // ISO timestamp
}
// Payloads hacia backend (ajustar nombres a DTO reales del backend si difieren)
export interface OrderPreviewRequest {
  ticketGroups: { showtimeId: number; seatCodes: string[] }[];
  concessions: { productId: number; quantity: number }[];
  promotionCode?: string;
}

export interface OrderConfirmRequest extends OrderPreviewRequest {
  paymentMethodId?: number; // opcional según flujo
}

export async function previewOrder(payload: OrderPreviewRequest): Promise<OrderPreview> {
  const resp = await api.post<OrderPreview>('/orders/preview', payload);
  return resp.data;
}

export async function confirmOrder(payload: OrderConfirmRequest): Promise<OrderConfirmation> {
  const resp = await api.post<OrderConfirmation>('/orders/confirm', payload);
  return resp.data;
}

export async function getOrder(orderId: number): Promise<OrderConfirmation> {
  const resp = await api.get<OrderConfirmation>(`/orders/${orderId}`);
  return resp.data;
}

export async function getOrdersForUser(userId: number | string): Promise<OrderSummary[]> {
  const resp = await api.get<OrderSummary[]>(`/users/${userId}/purchases`);
  return resp.data || [];
}

export default { previewOrder, confirmOrder, getOrder, getOrdersForUser };
