export interface Showtime {
  id: number;
  movieId: number;
  cinemaId: number;
  theaterId: number;
  startTime: string; // ISO
  format?: string; // 2D, 3D, IMAX
  language?: string; // Doblada/Subtitulada
  availableSeats?: number;
  totalSeats?: number;
  theaterName?: string;
  showtimeName?: string;
  price?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
}
