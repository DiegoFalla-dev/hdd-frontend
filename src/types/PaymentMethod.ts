export interface PaymentMethod {
  id: number;
  isDefault: boolean;
  maskedCardNumber: string;
  cardHolder: string;
  expiry: string;
}

export interface CreatePaymentMethod {
  cardNumber: string;
  cardHolder: string;
  cci: string;
  expiry: string;
  phone: string;
  isDefault: boolean;
}
