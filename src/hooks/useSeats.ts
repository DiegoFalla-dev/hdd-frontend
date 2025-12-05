import { useQuery } from '@tanstack/react-query';
import seatService from '../services/seatService';
import type { Seat } from '../types/Seat';

export function useSeats(showtimeId?: number) {
  return useQuery<Seat[]>({
    queryKey: ['showtime', showtimeId, 'seats'],
    queryFn: () => seatService.getSeatsByShowtime(showtimeId!),
    enabled: typeof showtimeId === 'number' && showtimeId > 0,
    staleTime: 60_000,
  });
}
