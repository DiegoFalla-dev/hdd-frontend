import { useQuery } from '@tanstack/react-query';
import api from '../services/apiClient';

interface UseFirstShowtimeParams {
  movieId?: number;
  cinemaId?: number;
  enabled?: boolean;
}

/**
 * Hook para obtener el primer showtime disponible de una película
 * Útil para mostrar la fecha de preventa en MovieCards
 */
export function useFirstShowtime({ movieId, cinemaId, enabled = true }: UseFirstShowtimeParams) {
  return useQuery({
    queryKey: ['firstShowtime', movieId, cinemaId],
    queryFn: async () => {
      if (!movieId || !cinemaId) return null;
      
      try {
        // Backend espera 'movie' y 'cinema' como nombres de parámetros
        const response = await api.get<any[]>('/showtimes', {
          params: {
            movie: movieId,
            cinema: cinemaId
          }
        });
        
        const showtimes = response.data;
        
        // Si el backend retorna una lista, buscar el showtime más próximo
        if (showtimes && Array.isArray(showtimes) && showtimes.length > 0) {
          // Mapear y ordenar por fecha
          const mapped = showtimes
            .map(s => {
              // Combinar date y time si vienen separados
              if (s.date && s.time) {
                const time = s.time.length === 5 ? `${s.time}:00` : s.time;
                return {
                  ...s,
                  startTime: `${s.date}T${time}`
                };
              }
              return s;
            })
            .filter(s => s.startTime || s.date)
            .sort((a, b) => {
              const dateA = a.startTime || a.date;
              const dateB = b.startTime || b.date;
              return dateA.localeCompare(dateB);
            });
          
          return mapped[0] || null;
        }
        
        return null;
      } catch (error) {
        console.warn(`Error fetching first showtime for movie ${movieId}:`, error);
        return null;
      }
    },
    enabled: enabled && !!movieId && !!cinemaId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}
