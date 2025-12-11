// usePayment.ts
import { useMutation } from '@tanstack/react-query';
import type { 
  PaymentProcessRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse, 
  PaymentStatus 
} from '../services/paymentService';
import paymentService from '../services/paymentService';

export interface UsePaymentResult {
  processPayment: (data: PaymentProcessRequest) => Promise<PaymentResponse>;
  refund: (data: RefundRequest) => Promise<RefundResponse>;
  getStatus: (transactionCode: string) => Promise<PaymentStatus>;
  isProcessing: boolean;
  isRefunding: boolean;
  error: Error | null;
}

export function usePayment(): UsePaymentResult {
  const paymentMutation = useMutation({
    mutationFn: (request: PaymentProcessRequest) => paymentService.processPayment(request),
  });

  const refundMutation = useMutation({
    mutationFn: (request: RefundRequest) => paymentService.processRefund(request),
  });

  return {
    processPayment: paymentMutation.mutateAsync,
    refund: refundMutation.mutateAsync,
    getStatus: async (code: string) => paymentService.getPaymentStatus(code),
    isProcessing: paymentMutation.isPending,
    isRefunding: refundMutation.isPending,
    error: paymentMutation.error || refundMutation.error,
  };
}

/**
 * Hook para validar tarjeta antes de enviar
 */
export function useCardValidation() {
  return {
    validate: paymentService.validateCard.bind(paymentService),
    validateNumber: paymentService.validateCardNumber.bind(paymentService),
    validateExpiry: paymentService.validateExpiry.bind(paymentService),
    validateCVV: paymentService.validateCVV.bind(paymentService),
  };
}
