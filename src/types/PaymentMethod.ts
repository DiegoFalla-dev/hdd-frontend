export type PaymentMethodType = 'CARD' | 'YAPE';

export interface PaymentMethod {
  id: number;
  type?: PaymentMethodType;
  brand?: string;
  last4?: string;
  holderName?: string;
  cardHolder?: string; // Alias para holderName
  expiryMonth?: number;
  expiryYear?: number;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  default?: boolean;
  createdAt?: string;
  phone?: string; // Para métodos tipo YAPE
}

export interface CreatePaymentMethodRequest {
  type?: PaymentMethodType;
  // Para CARD
  cardNumber?: string;
  cardHolder?: string;
  cci?: string;
  cvv?: string;
  expiry?: string;
  expiryMonth?: number;
  expiryYear?: number;
  expMonth?: number;
  expYear?: number;
  // Para YAPE
  phone?: string;
  verificationCode?: string;
  // General
  isDefault?: boolean;
  // Legacy aliases
  number?: string;
  holderName?: string;
  cvc?: string;
  setDefault?: boolean;
}
