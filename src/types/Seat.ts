export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'BLOCKED' | 'TEMPORARILY_RESERVED';

export interface Seat {
  id: number;
  showtimeId?: number;
  seatIdentifier?: string;
  row: string;
  number: number;
  status: SeatStatus;
}
