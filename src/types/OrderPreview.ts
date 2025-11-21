import type { Promotion } from './Promotion';

export interface OrderPreviewItem {
  type: 'TICKET' | 'CONCESSION' | 'DISCOUNT';
  label: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface OrderPreview {
  items: OrderPreviewItem[];
  ticketsSubtotal: number;
  concessionsSubtotal: number;
  discountTotal: number;
  grandTotal: number;
  promotion?: Promotion;
}
