import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderPreviewRequest } from '../services/orderService';
import { useCartStore } from '../store/cartStore';
import type { OrderPreview } from '../types/OrderPreview';

export function useOrderPreview(enabled: boolean = true) {
  const snapshot = useCartStore((s) => s.cartSnapshot());

  const payload: OrderPreviewRequest = {
    ticketGroups: snapshot.ticketGroups.map(g => ({ showtimeId: g.showtimeId, seatCodes: g.seatCodes })),
    concessions: snapshot.concessions.map(c => ({ productId: c.productId, quantity: c.quantity })),
    promotionCode: snapshot.promotion?.code,
  };

  const hasTickets = payload.ticketGroups.some(g => g.seatCodes.length > 0);

  return useQuery<OrderPreview>({
    queryKey: ['orderPreview', payload],
    queryFn: async () => {
      try {
        return await orderService.previewOrder(payload);
      } catch (err: any) {
        // Fallback: compute preview locally from cart snapshot if backend preview not available (e.g., 405)
        const localPreview: Partial<OrderPreview> = {
          ticketsSubtotal: snapshot.ticketsSubtotal,
          concessionsSubtotal: snapshot.concessionsSubtotal,
          discountTotal: snapshot.discountTotal,
          grandTotal: snapshot.grandTotal,
          promotion: snapshot.promotion,
        };
        return localPreview as OrderPreview;
      }
    },
    enabled: enabled && hasTickets,
    staleTime: 5_000,
  });
}
