export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: number;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number; // porcentaje o monto fijo según discountType
  startDate: string; // ISO format
  endDate: string; // ISO format
  minAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
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
