import { useQuery } from '@tanstack/react-query';
import seatService from '../services/seatService';

export function useOccupiedSeats(showtimeId?: number) {
  return useQuery<string[]>({
    queryKey: ['showtime', showtimeId, 'occupiedSeats'],
    queryFn: () => seatService.getOccupiedSeatCodes(showtimeId!),
    enabled: typeof showtimeId === 'number' && showtimeId > 0,
    staleTime: 15_000, // refresco relativamente frecuente
    refetchInterval: 30_000, // opcional: polling ligero para mantener estado actualizado
  });
}
