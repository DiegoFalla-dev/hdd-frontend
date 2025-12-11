import api from './apiClient';
import type { OrderPreview } from '../types/OrderPreview';

// Estructura de respuesta del backend (OrderDTO)
// Tipos mínimos para cubrir las vistas actuales
export interface OrderUserDTO {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  email?: string;
  ruc?: string;
  razonSocial?: string;
}

export interface OrderShowtimeDTO {
  movieTitle?: string;
  cinemaName?: string;
  theaterName?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:mm:ss
  format?: string; // e.g. 2D, 3D
}

export interface OrderMovieDTO {
  title?: string;
  duration?: number; // minutos
  image?: string;
  posterUrl?: string;
}

export interface OrderItemDTO {
  seatCode?: string;
  seatId?: number;
  price?: number;
  ticketType?: string; // code/name segun backend
  showtime?: OrderShowtimeDTO;
  movie?: OrderMovieDTO;
}

export interface OrderConcessionDTO {
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface OrderDTO {
  id: number;
  user: OrderUserDTO; // Comprador
  orderDate: string;
  createdAt?: string;   // Alias para orderDate
  orderStatus: string;
  paymentMethod: any;
  totalAmount: number;
  grandTotal?: number;  // Alias para totalAmount
  subtotalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  fidelityDiscountAmount?: number;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  qrCodeUrl?: string;
  invoiceType?: 'BOLETA' | 'FACTURA'; // Tipo de comprobante seleccionado
  // Detalle
  orderItems: OrderItemDTO[];
  orderConcessions?: OrderConcessionDTO[];
  promotion?: { code?: string; discountAmount?: number } | any;
  // Campos usados por Confirmacion para QR
  purchaseDate?: string;
  items?: any[];
  movie?: OrderMovieDTO;
}

// Resumen de compras para listado (historial)
export interface OrderSummary {
  id: number;
  purchaseNumber?: string; // número único tipo CIN-...
  movieTitle?: string;
  movieDuration?: number; // minutos
  cinemaName?: string;
  roomName?: string;
  showDate?: string; // YYYY-MM-DD
  showTime?: string; // HH:mm:ss
  showtimeDate?: string; // ISO timestamp de la función
  format?: string;
  totalAmount: number;
  status: string; // COMPLETED, PENDING, FAILED, etc.
  purchaseDate: string; // ISO timestamp
  orderItems?: any[]; // Entradas con asientos
  orderConcessions?: any[]; // Productos de dulcería
  // Descuentos aplicados
  promotion?: { code?: string; discountAmount?: number } | any;
  discountAmount?: number;
  fidelityDiscountAmount?: number;
}
// Payloads hacia backend (ajustar nombres a DTO reales del backend si difieren)
export interface OrderPreviewRequest {
  ticketGroups: { showtimeId: number; seatCodes: string[] }[];
  concessions: { productId: number; quantity: number }[];
  promotionCode?: string;
}

// Estructura de item individual que espera el backend (CreateOrderItemDTO)
export interface CreateOrderItemDTO {
  showtimeId: number;
  seatId: number;
  price: number;
  ticketType?: string;
}

// Estructura de orden que espera el backend (CreateOrderDTO)
export interface OrderConfirmRequest {
  userId: number;
  paymentMethodId: number;
  items: CreateOrderItemDTO[];
  promotionCode?: string;
  // Descuento por fidelización (opcional)
  fidelityPointsRedeemed?: number;
  fidelityDiscountAmount?: number;
}

export async function previewOrder(payload: OrderPreviewRequest): Promise<OrderPreview> {
  // Por ahora, el backend no tiene endpoint de preview, así que retornamos un cálculo local
  // TODO: Implementar endpoint de preview en el backend si se requiere
  const resp = await api.post<OrderPreview>('/orders/preview', payload);
  return resp.data;
}

export async function confirmOrder(payload: OrderConfirmRequest): Promise<OrderDTO> {
  // El backend usa POST /api/orders para crear órdenes y devuelve OrderDTO
  const resp = await api.post<OrderDTO>('/orders', payload);
  return resp.data;
}

export async function getOrder(orderId: number): Promise<OrderDTO> {
  const resp = await api.get<OrderDTO>(`/orders/${orderId}`);
  return resp.data;
}

export async function getOrdersForUser(userId: number | string): Promise<OrderSummary[]> {
  const resp = await api.get<OrderDTO[]>(`/users/${userId}/purchases`);
  // Mapear OrderDTO[] a OrderSummary[]
  const orders = resp.data || [];
  return orders.map(order => {
    const firstItem = order.orderItems?.[0];
    const showtime = firstItem?.showtime;
    const showtimeDateTime = showtime?.date && showtime?.time 
      ? `${showtime.date}T${showtime.time}` 
      : new Date().toISOString();
    
    return {
      id: order.id!,
      purchaseNumber: order.invoiceNumber || `CIN-${order.id}`,
      totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : Number(order.totalAmount || 0),
      status: order.orderStatus || 'COMPLETED',
      purchaseDate: order.orderDate || new Date().toISOString(),
      // Extraer información del showtime directamente
      movieTitle: showtime?.movieTitle || 'Película no disponible',
      cinemaName: showtime?.cinemaName || 'Cine no disponible',
      roomName: showtime?.theaterName || 'Sala no disponible',
      showDate: showtime?.date,
      showTime: showtime?.time,
      showtimeDate: showtimeDateTime,
      format: showtime?.format,
      // Incluir items y concesiones completos
      orderItems: order.orderItems || [],
      orderConcessions: order.orderConcessions || []
    };
  });
}

export default { previewOrder, confirmOrder, getOrder, getOrdersForUser };
