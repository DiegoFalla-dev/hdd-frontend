// paymentService.ts
import api from './apiClient';

export interface CardValidationRequest {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

export interface PaymentProcessRequest {
  amount: number;
  currency?: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  orderId?: number;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionCode: string;
  authCode: string;
  amount: number;
  message?: string;
  timestamp?: string;
}

export interface RefundRequest {
  transactionCode: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundCode: string;
  originalTransactionCode: string;
  amount: number;
  message?: string;
  timestamp?: string;
}

export interface PaymentStatus {
  transactionCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  amount: number;
  message?: string;
  timestamp?: string;
}

const paymentService = {
  /**
   * Validates a card using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Validates card expiry date (MM/YY format)
   */
  validateExpiry(expiry: string): boolean {
    const [month, year] = expiry.split('/');
    if (!month || !year) return false;

    const m = parseInt(month, 10);
    const y = parseInt('20' + year, 10);
    
    if (m < 1 || m > 12) return false;
    
    const now = new Date();
    const expiryDate = new Date(y, m - 1, 0);
    
    return expiryDate > now;
  },

  /**
   * Validates CVV (3-4 digits)
   */
  validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  },

  /**
   * Validates complete card data
   */
  validateCard(card: CardValidationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateCardNumber(card.cardNumber)) {
      errors.push('Número de tarjeta inválido');
    }

    if (!this.validateExpiry(card.expiry)) {
      errors.push('Fecha de vencimiento inválida o expirada');
    }

    if (!this.validateCVV(card.cvv)) {
      errors.push('CVV debe tener 3 o 4 dígitos');
    }

    if (!card.cardName || card.cardName.trim().length < 3) {
      errors.push('Nombre del titular requerido');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Process payment through backend
   */
  async processPayment(request: PaymentProcessRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post<PaymentResponse>('/api/payments/process', {
        amount: request.amount,
        currency: request.currency || 'PEN',
        cardNumber: request.cardNumber,
        cardName: request.cardName,
        expiry: request.expiry,
        cvv: request.cvv,
        orderId: request.orderId,
        description: request.description || 'Pago de entrada de cine',
      });

      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al procesar el pago';
      throw new Error(errorMsg);
    }
  },

  /**
   * Process refund
   */
  async processRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await api.post<RefundResponse>(
        `/api/payments/refund/${refundRequest.transactionCode}`,
        {
          reason: refundRequest.reason || 'Reembolso solicitado',
        }
      );

      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al procesar el reembolso';
      throw new Error(errorMsg);
    }
  },

  /**
   * Get payment status by transaction code
   */
  async getPaymentStatus(transactionCode: string): Promise<PaymentStatus> {
    try {
      const response = await api.get<PaymentStatus>(`/api/payments/status/${transactionCode}`);
      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener estado del pago';
      throw new Error(errorMsg);
    }
  },
};

export default paymentService;
