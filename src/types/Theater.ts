export interface Theater {
  id: number;
  cinemaId: number;
  name: string;
  format: string;
  rowCount: number;
  colCount: number;
  totalSeats: number;
  seatMatrixType: 'STANDARD' | 'VIP' | 'MIXED';
}