export interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: 'GENERAL' | 'CONVENIO';
  maxPorUsuario?: number;
}

export interface Ticket {
  id: number;
  orderItemId: number;
  seatNumber: number;
  qrCode: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
}
