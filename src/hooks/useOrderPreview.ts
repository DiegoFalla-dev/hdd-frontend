import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderPreviewRequest } from '../services/orderService';
import { useCartStore } from '../store/cartStore';
import type { OrderPreview } from '../types/OrderPreview';
import { useToast } from '../components/ToastProvider';
import { calculatePriceBreakdown } from '../utils/priceCalculation';

export function useOrderPreview(enabled: boolean = true) {
  const snapshot = useCartStore((s) => s.cartSnapshot());
  const toast = useToast();

  const payload: OrderPreviewRequest = {
    ticketGroups: snapshot.ticketGroups.map(g => ({ showtimeId: g.showtimeId, seatCodes: g.seatCodes })),
    concessions: snapshot.concessions.map(c => ({ productId: c.productId, quantity: c.quantity })),
    promotionCode: snapshot.promotion?.code,
  };

  const hasTickets = payload.ticketGroups.some(g => g.seatCodes.length > 0);

  return useQuery<OrderPreview>({
    queryKey: ['orderPreview', payload],
    queryFn: async () => {
      // El backend no tiene endpoint /orders/preview, calculamos localmente
      
      // Usar directamente los valores del snapshot (ya están calculados correctamente)
      const ticketsSubtotal = snapshot.ticketsSubtotal;
      const concessionsSubtotal = snapshot.concessionsSubtotal;
      const subtotal = Math.max(0, ticketsSubtotal + concessionsSubtotal);
      const breakdown = calculatePriceBreakdown(subtotal, snapshot.discountTotal);
      
      const localPreview: OrderPreview = {
        ticketsSubtotal: ticketsSubtotal,
        concessionsSubtotal: concessionsSubtotal,
        discountTotal: breakdown.discountAmount,
        taxTotal: breakdown.taxAmount,
        grandTotal: breakdown.grandTotal,
        promotion: snapshot.promotion,
      };
      
      return localPreview;
    },
    enabled: enabled && hasTickets,
    staleTime: 5_000,
  });
}
