export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'BLOCKED' | 'TEMPORARILY_RESERVED';

export interface ShowtimeSeat {
  id: number | string;
  row: string;
  number: number;
  status?: SeatStatus;
  // Campos originales, ahora opcionales para compatibilidad
  isAvalible?: boolean;
  movieShowtimeId?: number;
  seatId?: number;
  showtimeSeatId?: number;
}
