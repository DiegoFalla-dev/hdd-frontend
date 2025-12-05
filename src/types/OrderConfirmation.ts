import type { Promotion } from './Promotion';

export interface ConfirmedSeatGroup {
  showtimeId: number;
  seatCodes: string[];
}

export interface OrderConfirmation {
  orderId: number;
  orderNumber: string;
  seats: ConfirmedSeatGroup[];
  concessions: {
    productId: number;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  ticketsSubtotal: number;
  concessionsSubtotal: number;
  discountTotal: number;
  grandTotal: number;
  promotion?: Promotion;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  createdAt?: string;
}
