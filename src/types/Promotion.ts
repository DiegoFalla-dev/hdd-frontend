export interface Promotion {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minAmount: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

export interface ValidatePromotionRequest {
  code: string;
  amount: number;
}
