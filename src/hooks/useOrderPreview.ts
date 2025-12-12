import { useQuery } from '@tanstack/react-query';
// Comentado: orderService no se usa directamente en este hook
// import orderService from '../services/orderService';
import type { OrderPreviewRequest } from '../services/orderService';
import { useCartStore } from '../store/cartStore';
import type { OrderPreview } from '../types/OrderPreview';
// Comentado: toast no se usa
// import { useToast } from '../components/ToastProvider';
import { calculatePriceBreakdown } from '../utils/priceCalculation';

export function useOrderPreview(enabled: boolean = true) {
  const snapshot = useCartStore((s) => s.cartSnapshot());
  // Comentado: toast no se usa
  // const toast = useToast();

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
      
      // Construir items para el preview
      const items = [
        // Items de entradas
        ...snapshot.ticketGroups.map(group => ({
          type: 'TICKET' as const,
          label: `Entradas (Sesión ${group.showtimeId})`,
          quantity: group.seatCodes.length,
          unitPrice: ticketsSubtotal / (snapshot.ticketGroups.reduce((acc, g) => acc + g.seatCodes.length, 0) || 1),
          total: ticketsSubtotal,
        })),
        // Items de concesiones
        ...snapshot.concessions.map(c => ({
          type: 'CONCESSION' as const,
          label: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          total: c.unitPrice * c.quantity,
        })),
        // Item de descuento si aplica
        ...(snapshot.discountTotal > 0 ? [{
          type: 'DISCOUNT' as const,
          label: 'Descuento',
          total: -snapshot.discountTotal,
        }] : []),
      ];
      
      const localPreview: OrderPreview = {
        items,
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
