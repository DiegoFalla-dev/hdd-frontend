export type PaymentMethodType = 'CARD' | 'PAYPAL' | 'NEQUI' | 'OTHER';

export interface PaymentMethod {
  id: number;
  type?: PaymentMethodType;
  brand?: string;
  last4?: string;
  holderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  expMonth?: number; // legacy alias
  expYear?: number; // legacy alias
  isDefault?: boolean;
  default?: boolean; // legacy alias
  createdAt?: string;
}

export interface CreatePaymentMethodRequest {
  type?: PaymentMethodType;
  brand?: string;
  number?: string; // se envía al backend para tokenización
  cardNumber?: string; // legacy alias used across codebase
  holderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  expMonth?: number; // legacy alias
  expYear?: number; // legacy alias
  cvc?: string;
  setDefault?: boolean;
}
