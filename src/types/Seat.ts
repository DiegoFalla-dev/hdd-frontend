export interface Seat {
  id: string | number;
  row: string;
  number: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'TEMPORARILY_RESERVED';
}
