import { useMutation } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderConfirmRequest, OrderDTO } from '../services/orderService';

export function useOrderConfirm() {
  return useMutation<OrderDTO, Error, OrderConfirmRequest>({
    mutationFn: (payload) => orderService.confirmOrder(payload),
  });
}
