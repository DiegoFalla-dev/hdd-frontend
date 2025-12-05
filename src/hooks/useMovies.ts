import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { fetchMovies, fetchAllMovies } from '../services/moviesService';
import type { Movie, Paginated, MovieStatus } from '../types/Movie';

interface MoviesParams {
  status?: MovieStatus;
  genre?: string;
  q?: string;
  page?: number;
  size?: number;
}

// Paginated query (list with filters)
export function useMovies(params: MoviesParams): UseQueryResult<Paginated<Movie>> {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => fetchMovies(params),
    staleTime: 2 * 60 * 1000, // 2 min for movie listings
  });
}

// Convenience hook for a short all-movies list (e.g. banners/carousels)
export function useAllMovies(): UseQueryResult<Movie[]> {
  return useQuery({
    queryKey: ['movies', 'all'],
    queryFn: () => fetchAllMovies(),
    staleTime: 5 * 60 * 1000, // cache longer
  });
}
