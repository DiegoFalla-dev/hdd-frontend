import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderSummary } from '../services/orderService';
import authService from '../services/authService';

interface UseOrdersOptions {
  enabled?: boolean;
  page?: number; // futuro para paginación backend
  size?: number; // futuro para paginación backend
}

export function useOrders(opts: UseOrdersOptions = {}) {
  const user = authService.getCurrentUser();
  const userId = user?.id;
  return useQuery<OrderSummary[], Error>({
    queryKey: ['orders', userId, opts.page, opts.size],
    enabled: !!userId && (opts.enabled ?? true),
    queryFn: () => {
      if (!userId) throw new Error('Usuario no autenticado');
      return orderService.getOrdersForUser(userId);
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export default useOrders;