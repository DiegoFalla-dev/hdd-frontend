import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getShowtimes } from '../services/showtimeService';
import type { Showtime } from '../types/Showtime';

interface AvailableDate {
  label: string;      // DIA (ej: "LUN")
  date: string;       // DD/MM (ej: "09/12")
  fullDate: string;   // YYYY-MM-DD (ej: "2025-12-09")
}

interface Params {
  movieId?: number;
  cinemaId?: number;
}

/**
 * Hook para obtener las primeras 3 fechas disponibles desde hoy (GMT-5)
 * basadas en los showtimes existentes en el backend.
 */
export function useAvailableDates(params: Params): UseQueryResult<AvailableDate[]> {
  const { movieId, cinemaId } = params;
  
  return useQuery({
    queryKey: ['availableDates', movieId, cinemaId],
    queryFn: async (): Promise<AvailableDate[]> => {
      if (movieId == null || cinemaId == null) {
        return [];
      }
      
      // Obtener todos los showtimes sin filtrar por fecha
      // El backend debe devolver todos los showtimes futuros para esta película y cine
      const showtimes: Showtime[] = await getShowtimes({ 
        movieId, 
        cinemaId, 
        date: '' // Sin filtro de fecha para obtener todas las fechas disponibles
      });
      
      if (!showtimes || showtimes.length === 0) {
        return [];
      }
      
      // Fecha actual en GMT-5 (Perú)
      const now = new Date();
      now.setHours(now.getHours() - 5);
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Extraer fechas únicas de los showtimes >= hoy
      // El backend puede devolver solo fechas (sin startTime construido) cuando no se filtra por fecha
      const uniqueDates = new Set<string>();
      showtimes.forEach(showtime => {
        // Intentar extraer la fecha del startTime, o usar directamente el DTO si está disponible
        let showtimeDate: string | null = null;
        
        if (showtime.startTime && showtime.startTime.includes('T')) {
          // Si tiene startTime completo (ISO), extraerlo
          showtimeDate = showtime.startTime.split('T')[0];
        }
        
        if (showtimeDate && showtimeDate >= today) {
          uniqueDates.add(showtimeDate);
        }
      });
      
      // Convertir a array, ordenar y tomar las primeras 3
      const sortedDates = Array.from(uniqueDates).sort().slice(0, 3);
      
      // Formatear para el frontend
      return sortedDates.map(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
        const dayNumber = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        return {
          label: dayName,
          date: `${dayNumber}/${month}`,
          fullDate: dateStr
        };
      });
    },
    enabled: movieId != null && cinemaId != null,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
