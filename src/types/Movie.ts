export type MovieStatus = 'NOW_PLAYING' | 'UPCOMING' | 'PRESALE' | 'ENDED';

export interface Movie {
  id: number;
  title: string;
  // Compat aliases (legacy code expects Spanish names)
  titulo?: string;
  imagenCard?: string;
  synopsis?: string;
  genre?: string;
  durationMinutes?: number;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate?: string; // ISO
  status: MovieStatus;
  languages?: string[];
  formats?: string[]; // 2D, 3D, IMAX
  rating?: number; // promedio
}

export interface Paginated<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
