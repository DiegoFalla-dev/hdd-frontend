import { useMutation } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderConfirmRequest } from '../services/orderService';
import type { OrderConfirmation } from '../types/OrderConfirmation';

export function useOrderConfirm() {
  return useMutation<OrderConfirmation, Error, OrderConfirmRequest>({
    mutationFn: (payload) => orderService.confirmOrder(payload),
  });
}
