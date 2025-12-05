import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderConfirmation } from '../types/OrderConfirmation';

export function useOrder(orderId: number | undefined) {
  return useQuery<OrderConfirmation, Error>({
    queryKey: ['order', orderId],
    queryFn: () => {
      if (!orderId) throw new Error('ID de orden requerido');
      return orderService.getOrder(orderId);
    },
    enabled: !!orderId,
    retry: 1,
    refetchInterval: (data) => {
      if (!data) return 5000; // mientras carga
      // `data` may be typed differently by react-query; coerce safely
      const d = data as unknown as OrderConfirmation | undefined;
      return d?.paymentStatus === 'PENDING' ? 5000 : false;
    },
    refetchIntervalInBackground: true,
  });
}