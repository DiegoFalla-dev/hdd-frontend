export interface Promotion {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number; // percent value or flat amount
  maxDiscount?: number; // optional cap when percent
  description?: string;
}
export type DiscountType = 'PERCENTAGE' | 'AMOUNT';

export interface Promotion {
  id?: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  value: number; // porcentaje o monto fijo según discountType
  expiresAt?: string; // ISO
  active?: boolean;
}

export interface PromotionValidationRequest {
  items: OrderItem[];
  promotionCode?: string;
}

export interface PromotionValidationResponse {
  valid: boolean;
  promotionCode?: string;
  discountTotal: number;
  totalAfterDiscount: number;
  message?: string;
}

// Forward declaration to avoid cycles
export interface OrderItem {
  productType: 'TICKET' | 'CONCESSION';
  itemId: number; // seatId o productId
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}
