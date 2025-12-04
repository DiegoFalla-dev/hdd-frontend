import { useQuery } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderPreviewRequest } from '../services/orderService';
import { useCartStore } from '../store/cartStore';
import type { OrderPreview } from '../types/OrderPreview';
import { useToast } from '../components/ToastProvider';

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
      try {
        return await orderService.previewOrder(payload);
      } catch (err: any) {
        // Fallback: compute preview locally from cart snapshot if backend preview not available (e.g., 405)
        
        // Try to get more accurate data from pendingOrder if cart snapshot is incomplete
        let ticketsSubtotal = snapshot.ticketsSubtotal;
        
        if (ticketsSubtotal === 0) {
          // Try to calculate from pendingOrder
          try {
            const pendingOrderRaw = localStorage.getItem('pendingOrder');
            if (pendingOrderRaw) {
              const pendingOrder = JSON.parse(pendingOrderRaw);
              if (pendingOrder.entradas && Array.isArray(pendingOrder.entradas)) {
                ticketsSubtotal = pendingOrder.entradas.reduce((sum: number, e: any) => 
                  sum + (e.precio * e.cantidad), 0
                );
                console.log('🔄 Using tickets total from pendingOrder:', ticketsSubtotal);
              }
            }
          } catch (e) {
            console.warn('Could not read pendingOrder for preview', e);
          }
        }
        
        const base = Math.max(0, ticketsSubtotal + snapshot.concessionsSubtotal - snapshot.discountTotal);
        const tax = typeof snapshot.taxTotal === 'number' ? snapshot.taxTotal : parseFloat((base * 0.18).toFixed(2));
        const localPreview: Partial<OrderPreview> = {
          ticketsSubtotal: ticketsSubtotal,
          concessionsSubtotal: snapshot.concessionsSubtotal,
          discountTotal: snapshot.discountTotal,
          taxTotal: tax,
          grandTotal: parseFloat((base + tax).toFixed(2)),
          promotion: snapshot.promotion,
        };
        try { toast.info('Preview calculado localmente'); } catch (e) { /* ignore */ }
        return localPreview as OrderPreview;
      }
    },
    enabled: enabled && hasTickets,
    staleTime: 5_000,
  });
}
