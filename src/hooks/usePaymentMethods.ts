import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import paymentMethodService from '../services/paymentMethodService';
import type { PaymentMethod, CreatePaymentMethodRequest } from '../types/PaymentMethod';

export function usePaymentMethods() {
  return useQuery<PaymentMethod[], Error>({
    queryKey: ['paymentMethods'],
    queryFn: () => paymentMethodService.listPaymentMethods(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddPaymentMethod() {
  const qc = useQueryClient();
  return useMutation<PaymentMethod, Error, CreatePaymentMethodRequest>({
    mutationFn: (p) => paymentMethodService.createPaymentMethod(transformPaymentRequest(p)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paymentMethods'] }); }
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => paymentMethodService.deletePaymentMethod(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paymentMethods'] }); }
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation<PaymentMethod, Error, number>({
    mutationFn: (id) => paymentMethodService.setDefaultPaymentMethod(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paymentMethods'] }); }
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation<PaymentMethod, Error, { id: number; data: CreatePaymentMethodRequest }>({
    mutationFn: ({ id, data }) => paymentMethodService.updatePaymentMethod(id, transformPaymentRequest(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paymentMethods'] }); }
  });
}

// Transformar el payload del formulario al formato esperado por el backend
function transformPaymentRequest(req: CreatePaymentMethodRequest): CreatePaymentMethodRequest {
  const transformed: any = {
    type: req.type,
    isDefault: req.isDefault || req.setDefault,
  };

  // Solo agregar campos relevantes según el tipo
  if (req.type === 'CARD') {
    transformed.cardNumber = req.cardNumber || req.number;
    transformed.cardHolder = req.cardHolder || req.holderName;
    transformed.cci = req.cci || req.cvc || (req as any).cvv;
    // Convertir expMonth/expYear a formato expiry MM/YY
    if (req.expMonth && req.expYear) {
      const month = String(req.expMonth).padStart(2, '0');
      const year = String(req.expYear).slice(-2);
      transformed.expiry = `${month}/${year}`;
    } else if (req.expiry) {
      transformed.expiry = req.expiry;
    }
  } else if (req.type === 'YAPE') {
    transformed.phone = req.phone;
    transformed.verificationCode = req.verificationCode;
  }

  return transformed;
}