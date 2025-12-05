import { queryClient } from './queryClient';
import { fetchAllMovies } from '../services/moviesService';
import { getAllCinemas } from '../services/cinemaService';
import { getProductsByCinema } from '../services/concessionService';

// Prefetch core datasets after login to speed up first navigation.
export async function prefetchAfterLogin(selectedCinemaId?: number) {
  const tasks: Promise<unknown>[] = [];
  tasks.push(queryClient.prefetchQuery({ queryKey: ['movies', 'all'], queryFn: fetchAllMovies }));
  tasks.push(queryClient.prefetchQuery({ queryKey: ['cinemas'], queryFn: getAllCinemas }));
  if (selectedCinemaId) {
    tasks.push(queryClient.prefetchQuery({ queryKey: ['concessions', selectedCinemaId], queryFn: () => getProductsByCinema(selectedCinemaId) }));
  }
  await Promise.allSettled(tasks);
}

// Prefetch when user selects a cinema to reduce wait in Dulcería / Cartelera transitions.
export async function prefetchOnCinemaSelection(cinemaId: number) {
  await queryClient.prefetchQuery({ queryKey: ['concessions', cinemaId], queryFn: () => getProductsByCinema(cinemaId) });
}
