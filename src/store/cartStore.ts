import { create } from 'zustand';
import type { ConcessionProduct } from '../types/ConcessionProduct';
import type { Promotion } from '../types/Promotion';

// Nuevo modelo de tickets: agrupados por showtime con lista de códigos de asiento confirmados
export interface CartTicketGroup {
  showtimeId: number;
  seatCodes: string[]; // e.g. ["A10","A11"] ya confirmados
  unitPrice: number; // precio por asiento (homogéneo); puede evolucionar a mapa por código
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
  setTicketGroup: (showtimeId: number, seatCodes: string[], unitPrice: number) => void;
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
    grandTotal: number;
    paymentItems: PaymentItem[];
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  ticketGroups: [],
  concessions: [],
  appliedPromotion: undefined,
  setTicketGroup: (showtimeId, seatCodes, unitPrice) => {
    set((s) => {
      const existing = s.ticketGroups.find((g) => g.showtimeId === showtimeId);
      if (existing) {
        return {
          ticketGroups: s.ticketGroups.map((g) =>
            g.showtimeId === showtimeId ? { ...g, seatCodes: [...seatCodes], unitPrice } : g,
          ),
        };
      }
      return { ticketGroups: [...s.ticketGroups, { showtimeId, seatCodes: [...seatCodes], unitPrice }] };
    });
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
  },
  clearTickets: () => set({ ticketGroups: [] }),
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
  },
  updateConcession: (productId, quantity) => {
    if (quantity <= 0) {
      set((s) => ({ concessions: s.concessions.filter((c) => c.productId !== productId) }));
      return;
    }
    set((s) => ({
      concessions: s.concessions.map((c) =>
        c.productId === productId ? { ...c, quantity } : c,
      ),
    }));
  },
  removeConcession: (productId) => {
    set((s) => ({ concessions: s.concessions.filter((c) => c.productId !== productId) }));
  },
  applyPromotion: (promotion) => {
    set({ appliedPromotion: promotion });
  },
  clearPromotion: () => set({ appliedPromotion: undefined }),
  clearCart: () =>
    set({
      ticketGroups: [],
      concessions: [],
      appliedPromotion: undefined,
    }),
  ticketsSubtotal: () =>
    get().ticketGroups.reduce(
      (sum, g) => sum + g.unitPrice * g.seatCodes.length,
      0,
    ),
  concessionsSubtotal: () =>
    get().concessions.reduce(
      (sum, c) => sum + c.unitPrice * c.quantity,
      0,
    ),
  discountTotal: () => {
    const promo = get().appliedPromotion;
    if (!promo) return 0;
    const base = get().ticketsSubtotal() + get().concessionsSubtotal();
    if (promo.type === 'PERCENT') {
      const raw = (base * promo.value) / 100;
      return promo.maxDiscount ? Math.min(raw, promo.maxDiscount) : raw;
    }
    if (promo.type === 'FLAT') {
      return Math.min(promo.value, base);
    }
    return 0;
  },
  grandTotal: () => {
    const total = get().ticketsSubtotal() + get().concessionsSubtotal() - get().discountTotal();
    return Math.max(0, total);
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
  cartSnapshot: () => ({
    ticketGroups: get().ticketGroups,
    concessions: get().concessions,
    promotion: get().appliedPromotion,
    ticketsSubtotal: get().ticketsSubtotal(),
    concessionsSubtotal: get().concessionsSubtotal(),
    discountTotal: get().discountTotal(),
    grandTotal: get().grandTotal(),
    paymentItems: get().paymentItems(),
  }),
}));
