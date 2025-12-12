import { create } from 'zustand';
import type { ConcessionProduct } from '../types/ConcessionProduct';
import type { Promotion } from '../types/Promotion';
// Comentado: IGV_RATE no se usa
import { calculatePriceBreakdown } from '../utils/priceCalculation';

const STORAGE_KEY = 'cartStore';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse cartStore from localStorage', e);
    return null;
  }
}

// Nuevo modelo de tickets: agrupados por showtime con lista de códigos de asiento confirmados
export interface CartTicketGroup {
  showtimeId: number;
  seatCodes: string[]; // e.g. ["A10","A11"] ya confirmados
  unitPrice: number; // precio por asiento (homogéneo); puede evolucionar a mapa por código
  totalPrice?: number; // precio total ya calculado (para casos con múltiples tipos de entrada)
}

export interface CartConcessionItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface TicketPaymentItem {
  type: 'TICKET';
  showtimeId: number;
  seatCode: string; // Código de asiento único
  unitPrice: number;
  totalPrice: number; // unitPrice * 1
}

export interface ConcessionPaymentItem {
  type: 'CONCESSION';
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number; // unitPrice * quantity
}

export type PaymentItem = TicketPaymentItem | ConcessionPaymentItem;

interface CartState {
  ticketGroups: CartTicketGroup[];
  concessions: CartConcessionItem[];
  appliedPromotion?: Promotion; // DTO de promoción validada
  setTicketGroup: (showtimeId: number, seatCodes: string[], unitPrice: number, totalPrice?: number) => void;
  removeSeatFromGroup: (showtimeId: number, seatCode: string) => void;
  clearTickets: () => void;
  addConcession: (product: ConcessionProduct, quantity?: number) => void;
  updateConcession: (productId: number, quantity: number) => void;
  removeConcession: (productId: number) => void;
  applyPromotion: (promotion: Promotion | undefined) => void;
  clearPromotion: () => void;
  clearCart: () => void;
  ticketsSubtotal: () => number;
  concessionsSubtotal: () => number;
  taxTotal: () => number;
  discountTotal: () => number;
  grandTotal: () => number;
  paymentItems: () => PaymentItem[];
  cartSnapshot: () => {
    ticketGroups: CartTicketGroup[];
    concessions: CartConcessionItem[];
    promotion?: Promotion;
    ticketsSubtotal: number;
    concessionsSubtotal: number;
    discountTotal: number;
    taxTotal?: number;
    grandTotal: number;
    paymentItems: PaymentItem[];
  };
}

export const useCartStore = create<CartState>((set, get) => {
  const persisted = loadFromStorage() || {};
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ticketGroups: get().ticketGroups, concessions: get().concessions, appliedPromotion: get().appliedPromotion }));
    } catch (e) {
      // ignore
    }
  };

  return {
    ticketGroups: (persisted.ticketGroups as CartTicketGroup[]) || [],
    concessions: (persisted.concessions as CartConcessionItem[]) || [],
    appliedPromotion: (persisted.appliedPromotion as Promotion) || undefined,
    setTicketGroup: (showtimeId, seatCodes, unitPrice, totalPrice) => {
      set((s) => {
        const existing = s.ticketGroups.find((g) => g.showtimeId === showtimeId);
        if (existing) {
          return {
            ticketGroups: s.ticketGroups.map((g) =>
              g.showtimeId === showtimeId ? { ...g, seatCodes: [...seatCodes], unitPrice, totalPrice } : g,
            ),
          };
        }
        return { ticketGroups: [...s.ticketGroups, { showtimeId, seatCodes: [...seatCodes], unitPrice, totalPrice }] };
      });
      persist();
    },
    removeSeatFromGroup: (showtimeId, seatCode) => {
      set((s) => ({
        ticketGroups: s.ticketGroups
          .map((g) =>
            g.showtimeId === showtimeId
              ? { ...g, seatCodes: g.seatCodes.filter((c) => c !== seatCode) }
              : g,
          )
          .filter((g) => g.seatCodes.length > 0),
      }));
      persist();
    },
    clearTickets: () => {
      set({ ticketGroups: [] });
      persist();
    },
    addConcession: (product, quantity = 1) => {
      set((s) => {
        const existing = s.concessions.find((c) => c.productId === product.id);
        if (existing) {
          return {
            concessions: s.concessions.map((c) =>
              c.productId === product.id
                ? { ...c, quantity: c.quantity + quantity }
                : c,
            ),
          };
        }
        return {
          concessions: [
            ...s.concessions,
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity,
            },
          ],
        };
      });
      persist();
    },
    updateConcession: (productId, quantity) => {
      if (quantity <= 0) {
        set((s) => ({ concessions: s.concessions.filter((c) => c.productId !== productId) }));
        persist();
        return;
      }
      set((s) => ({
        concessions: s.concessions.map((c) =>
          c.productId === productId ? { ...c, quantity } : c,
        ),
      }));
      persist();
    },
    removeConcession: (productId) => {
      set((s) => ({ concessions: s.concessions.filter((c) => c.productId !== productId) }));
      persist();
    },
    applyPromotion: (promotion) => {
      set({ appliedPromotion: promotion });
      persist();
    },
    clearPromotion: () => {
      set({ appliedPromotion: undefined });
      persist();
    },
    clearCart: () => {
      set({
        ticketGroups: [],
        concessions: [],
        appliedPromotion: undefined,
      });
      persist();
    },
    ticketsSubtotal: () =>
      get().ticketGroups.reduce(
        (sum, g) => sum + (g.totalPrice ?? (g.unitPrice * g.seatCodes.length)),
        0,
      ),
    concessionsSubtotal: () =>
      get().concessions.reduce(
        (sum, c) => sum + c.unitPrice * c.quantity,
        0,
      ),
    // Tax amount (IGV) applied on subtotal after discounts
    taxTotal: () => {
      const subtotal = get().ticketsSubtotal() + get().concessionsSubtotal();
      const discount = get().discountTotal();
      const breakdown = calculatePriceBreakdown(subtotal, discount);
      return breakdown.taxAmount;
    },
    discountTotal: () => {
      const promo = get().appliedPromotion;
      if (!promo) return 0;
      const base = get().ticketsSubtotal() + get().concessionsSubtotal();
      // Usa discountType en lugar de type, y PERCENTAGE en lugar de PERCENT
      if (promo.discountType === 'PERCENTAGE') {
        // Para descuentos porcentuales: calcula el % del subtotal
        const raw = (base * promo.value) / 100;
        return raw;
      }
      if (promo.discountType === 'FIXED_AMOUNT') {
        // Para descuentos de monto fijo: resta el monto pero no puede ser mayor que el subtotal
        return Math.min(promo.value, base);
      }
      return 0;
    },
    grandTotal: () => {
      const subtotal = get().ticketsSubtotal() + get().concessionsSubtotal();
      const discount = get().discountTotal();
      const breakdown = calculatePriceBreakdown(subtotal, discount);
      return breakdown.grandTotal;
    },
    paymentItems: () => {
      const items: PaymentItem[] = [];
      // Tickets: cada asiento individual como item
      for (const group of get().ticketGroups) {
        for (const seatCode of group.seatCodes) {
          items.push({
            type: 'TICKET',
            showtimeId: group.showtimeId,
            seatCode,
            unitPrice: group.unitPrice,
            totalPrice: group.unitPrice,
          });
        }
      }
      // Concesiones
      for (const c of get().concessions) {
        items.push({
          type: 'CONCESSION',
          productId: c.productId,
          name: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          totalPrice: c.unitPrice * c.quantity,
        });
      }
      return items;
    },
    cartSnapshot: () => {
      const ticketsSubtotal = get().ticketsSubtotal();
      const concessionsSubtotal = get().concessionsSubtotal();
      const subtotal = ticketsSubtotal + concessionsSubtotal;
      const discountTotal = get().discountTotal();
      const breakdown = calculatePriceBreakdown(subtotal, discountTotal);
      
      return {
        ticketGroups: get().ticketGroups,
        concessions: get().concessions,
        promotion: get().appliedPromotion,
        ticketsSubtotal, // Subtotal de entradas SIN IGV
        concessionsSubtotal, // Subtotal de concesiones SIN IGV
        discountTotal: breakdown.discountAmount,
        taxTotal: breakdown.taxAmount, // IGV aplicado UNA SOLA VEZ
        grandTotal: breakdown.grandTotal,
        paymentItems: get().paymentItems(),
      };
    },
  };
});
