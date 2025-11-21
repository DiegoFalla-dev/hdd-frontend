export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'BLOCKED';

export interface Seat {
  id: number;
  row: string;
  number: number;
  status: SeatStatus;
}
