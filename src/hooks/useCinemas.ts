import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getAllCinemas } from '../services/cinemaService';
import type { Cinema } from '../types/Cinema';

export function useCinemas(): UseQueryResult<Cinema[]> {
  return useQuery({
    queryKey: ['cinemas'],
    queryFn: () => getAllCinemas(),
    staleTime: 10 * 60 * 1000, // Cinemas rarely change
  });
}
