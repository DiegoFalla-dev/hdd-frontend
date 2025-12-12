import type { ShowtimeSeat } from './ShowtimeSeat';

export interface Theater {
  id: number;
  name: string;
  capacity: number;
  seats?: ShowtimeSeat[];
  type?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
  rows?: number;
  columns?: number;
  // Backend DTO fields
  cinemaId?: number;
  cinemaName?: string;
  seatMatrixType?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  rowCount?: number;
  colCount?: number;
  totalSeats?: number;
}
