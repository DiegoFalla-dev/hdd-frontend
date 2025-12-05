import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getProductsByCinema } from '../services/concessionService';
import type { ConcessionProduct } from '../types/ConcessionProduct';

export function useConcessions(cinemaId: number | undefined): UseQueryResult<ConcessionProduct[]> {
  return useQuery({
    queryKey: ['concessions', cinemaId],
    queryFn: () => {
      if (cinemaId == null) return Promise.resolve([]);
      return getProductsByCinema(cinemaId);
    },
    enabled: cinemaId != null,
    staleTime: 5 * 60 * 1000,
  });
}
