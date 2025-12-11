import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderDTO } from '../services/orderService';

export function useOrder(orderId: number | undefined) {
  return useQuery<OrderDTO, Error>({
    queryKey: ['order', orderId],
    queryFn: () => {
      if (!orderId) throw new Error('ID de orden requerido');
      return orderService.getOrder(orderId);
    },
    enabled: !!orderId,
    retry: (failureCount, error) => {
      // No retry en 404 (orden no encontrada)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status === 404) return false;
      }
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000; // mientras carga
      // Refetch cada 5s si está pendiente
      return data.orderStatus === 'PENDING' ? 5000 : false;
    },
    refetchIntervalInBackground: true,
    staleTime: 30_000, // 30s para órdenes
  });
}