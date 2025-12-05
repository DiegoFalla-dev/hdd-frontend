import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initSeatSocket } from '../services/seatSocket';

export function useSeatOccupancySocket(showtimeId?: number) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!showtimeId || showtimeId <= 0) return;
    const unsubscribe = initSeatSocket(showtimeId, (occupiedCodes) => {
      queryClient.setQueryData(['showtime', showtimeId, 'occupiedSeats'], occupiedCodes);
    });
    return () => unsubscribe();
  }, [showtimeId, queryClient]);
}