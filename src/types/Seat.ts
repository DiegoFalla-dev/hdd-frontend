export interface Seat {
  id: number;
  theaterId: number;
  row: string;
  column: number;
  number: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'SELECTED';
  isAvailable: boolean;
  isReserved: boolean;
  type: 'STANDARD' | 'VIP' | 'WHEELCHAIR';
  price: number;
}

export interface SeatLayout {
  rows: number;
  columns: number;
  seats: Seat[];
}
