import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchAllMovies } from '../services/moviesService';
// Comentado: Movie no se usa
// import type { Movie } from '../types/Movie';

/**
 * Hook para sincronización en tiempo real de la cartelera
 * Implementa polling automático y notificaciones de cambios
 */
export function useMoviesRealtime(options?: {
  /** Intervalo de polling en milisegundos (default: 60000 = 1 minuto) */
  pollingInterval?: number;
  /** Habilitar notificaciones de cambios (default: true) */
  enableNotifications?: boolean;
}) {
  const queryClient = useQueryClient();
  const [hasUpdates, setHasUpdates] = useState(false);
  const [previousMovieIds, setPreviousMovieIds] = useState<number[]>([]);
  
  const {
    pollingInterval = 60 * 1000, // 1 minuto por defecto
    enableNotifications = true,
  } = options || {};

  const query = useQuery({
    queryKey: ['movies', 'realtime'],
    queryFn: fetchAllMovies,
    staleTime: 30 * 1000, // 30s
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Detectar cambios en la cartelera
  useEffect(() => {
    if (!query.data) return;

    const currentMovieIds = query.data.map(m => m.id).sort();
    
    // Primera carga
    if (previousMovieIds.length === 0) {
      setPreviousMovieIds(currentMovieIds);
      return;
    }

    // Detectar cambios
    const hasChanges = 
      currentMovieIds.length !== previousMovieIds.length ||
      currentMovieIds.some((id, idx) => id !== previousMovieIds[idx]);

    if (hasChanges && enableNotifications) {
      setHasUpdates(true);
      console.log('🎬 Cartelera actualizada:', {
        antes: previousMovieIds.length,
        ahora: currentMovieIds.length,
      });
    }

    setPreviousMovieIds(currentMovieIds);
  }, [query.data, previousMovieIds, enableNotifications]);

  // Función para refrescar manualmente y limpiar la notificación
  const refresh = async () => {
    setHasUpdates(false);
    await queryClient.invalidateQueries({ queryKey: ['movies'] });
  };

  // Función para descartar la notificación sin refrescar
  const dismissUpdate = () => {
    setHasUpdates(false);
  };

  return {
    ...query,
    hasUpdates,
    refresh,
    dismissUpdate,
  };
}

/**
 * Hook para sincronización de showtimes en tiempo real
 */
export function useShowtimesRealtime(movieId: number, cinemaId: number, date: string) {
  const queryClient = useQueryClient();
  const [hasUpdates, setHasUpdates] = useState(false);

  const query = useQuery({
    queryKey: ['showtimes', 'realtime', movieId, cinemaId, date],
    queryFn: async () => {
      const { getShowtimes } = await import('../services/showtimeService');
      return getShowtimes({ movieId, cinemaId, date });
    },
    staleTime: 15 * 1000, // 15s - muy dinámico
    refetchInterval: 30 * 1000, // Cada 30s
    refetchIntervalInBackground: true,
    enabled: !!movieId && !!cinemaId && !!date,
  });

  // Detectar cambios en showtimes
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    
    const previousData = queryClient.getQueryData([
      'showtimes', 
      'realtime', 
      movieId, 
      cinemaId, 
      date
    ]);

    if (previousData && JSON.stringify(previousData) !== JSON.stringify(query.data)) {
      setHasUpdates(true);
    }
  }, [query.data, queryClient, movieId, cinemaId, date]);

  const refresh = async () => {
    setHasUpdates(false);
    await queryClient.invalidateQueries({ 
      queryKey: ['showtimes', movieId, cinemaId, date] 
    });
  };

  return {
    ...query,
    hasUpdates,
    refresh,
    dismissUpdate: () => setHasUpdates(false),
  };
}
