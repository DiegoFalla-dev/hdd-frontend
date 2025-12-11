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
      // date puede ser undefined o una cadena vacía para obtener todas las fechas
      if (movieId == null || cinemaId == null || date === undefined) return Promise.resolve([]);
      return getShowtimes({ movieId, cinemaId, date });
    },
    enabled: movieId != null && cinemaId != null && date !== undefined,
    staleTime: 30 * 1000, // 30s - horarios críticos
    refetchInterval: 60 * 1000, // Refetch cada minuto para disponibilidad actualizada
    select: (showtimes) => {
      const now = new Date();
      // Filtrar funciones que ya pasaron o no tienen asientos
      return showtimes.filter(st => {
        if (!st.startTime) return false;
        const showtimeDate = new Date(st.startTime);
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
        // Debe ser al menos 15 minutos en el futuro y tener asientos disponibles
        return showtimeDate > fifteenMinutesFromNow && (st.availableSeats ?? 0) > 0;
      });
    },
  });
}

// Hook para verificar si un horario específico está disponible
export function useShowtimeAvailability(showtimeId: number | undefined) {
  return useQuery({
    queryKey: ['showtime-availability', showtimeId],
    queryFn: async () => {
      if (!showtimeId) return null;
      // Obtener datos del showtime específico
      const showtimes = await getShowtimes({ movieId: 0, cinemaId: 0, date: '' });
      return showtimes.find(st => st.id === showtimeId);
    },
    enabled: !!showtimeId,
    staleTime: 15 * 1000, // 15s - muy crítico
    refetchInterval: 30 * 1000, // Refetch cada 30s
    select: (showtime) => {
      if (!showtime) return { isAvailable: false, reason: 'Función no encontrada' };
      
      const now = new Date();
      if (!showtime.startTime) {
        return { isAvailable: false, reason: 'Función sin fecha válida' };
      }
      
      const showtimeDate = new Date(showtime.startTime);
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      
      if (showtimeDate <= now) {
        return { isAvailable: false, reason: 'La función ya pasó' };
      }
      
      if (showtimeDate <= fifteenMinutesFromNow) {
        return { isAvailable: false, reason: 'Debe reservar con al menos 15 minutos de anticipación' };
      }
      
      if ((showtime.availableSeats ?? 0) <= 0) {
        return { isAvailable: false, reason: 'No hay asientos disponibles' };
      }
      
      return { 
        isAvailable: true, 
        availableSeats: showtime.availableSeats,
        showtime 
      };
    },
  });
}
