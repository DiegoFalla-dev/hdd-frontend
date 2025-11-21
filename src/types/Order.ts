import type { OrderItem } from './Promotion';

export type OrderStatus = 'CREATED' | 'PAID' | 'CANCELLED';

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  promotionCode?: string;
  status: OrderStatus;
  createdAt?: string;
}

export interface OrderPreviewRequest {
  items: OrderItem[];
  promotionCode?: string;
}

export interface OrderPreviewResponse {
  subtotal: number;
  discountTotal: number;
  total: number;
  promotionCode?: string;
  items: OrderItem[];
}

export interface CreateOrderRequest extends OrderPreviewRequest {
  paymentMethodId?: number;
}
