import { useQuery } from '@tanstack/react-query';
import seatService from '../services/seatService';
import type { Seat } from '../types/Seat';

export function useSeats(showtimeId?: number) {
  return useQuery<Seat[]>({
    queryKey: ['showtime', showtimeId, 'seats'],
    queryFn: () => seatService.getSeatsByShowtime(showtimeId!),
    enabled: typeof showtimeId === 'number' && showtimeId > 0,
    staleTime: 30_000, // 30s - datos críticos de disponibilidad
    refetchOnMount: true, // Siempre refetch al montar para datos frescos
    retry: (failureCount, error) => {
      // Retry agresivo en seats por ser crítico
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status === 404) return false; // Showtime no existe
      }
      return failureCount < 3;
    },
  });
}
