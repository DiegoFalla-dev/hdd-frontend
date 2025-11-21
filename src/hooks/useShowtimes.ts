import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getShowtimes } from '../services/showtimeService';
import type { Showtime } from '../types/Showtime';

interface Params {
  movieId?: number;
  cinemaId?: number;
  date?: string; // YYYY-MM-DD
}

export function useShowtimes(params: Params): UseQueryResult<Showtime[]> {
  const { movieId, cinemaId, date } = params;
  return useQuery({
    queryKey: ['showtimes', movieId, cinemaId, date],
    queryFn: () => {
      if (movieId == null || cinemaId == null || !date) return Promise.resolve([]);
      return getShowtimes({ movieId, cinemaId, date });
    },
    enabled: movieId != null && cinemaId != null && !!date,
    staleTime: 60 * 1000, // keep fresh
  });
}
