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
    mutationFn: (p) => paymentMethodService.createPaymentMethod(p),
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