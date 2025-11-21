import api from './apiClient';
import type { Movie, Paginated, MovieStatus } from '../types/Movie';

// DTO esperado del backend tras Fase 0
interface BackendMovieDTO {
  id: number;
  title: string;
  synopsis?: string;
  genre?: string;
  classification?: string;
  // some backends return a human readable duration like "1h 50m"
  durationMinutes?: number;
  duration?: string;
  // different backends may use different keys for images
  posterUrl?: string;
  cardImageUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  cast?: string[];
  languages?: string[];
  formats?: string[];
  releaseDate?: string;
  rating?: number;
  // backend may use localized status strings like 'CARTELERA', 'PREVENTA', 'PROXIMO'
  status: string;
}

interface BackendPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

function mapMovie(m: BackendMovieDTO): Movie {
  // Normalize image field (posterUrl may be named cardImageUrl)
  const poster = m.posterUrl || m.cardImageUrl || m.bannerUrl || undefined;

  // Map backend localized status to frontend MovieStatus
  const rawStatus = (m.status ?? '').toString().toLowerCase();
  function mapStatus(s: string) {
    if (!s) return 'NOW_PLAYING' as const;
    if (s.includes('cartel')) return 'NOW_PLAYING' as const;
    if (s.includes('preventa') || s.includes('presale')) return 'PRESALE' as const;
    if (s.includes('proxim') || s.includes('proximo') || s.includes('próxim')) return 'UPCOMING' as const;
    if (s.includes('ended') || s.includes('final')) return 'ENDED' as const;
    return 'NOW_PLAYING' as const;
  }

  return {
    id: m.id,
    title: m.title,
    // backward compatible aliases used across the app
    titulo: m.title,
    synopsis: m.synopsis,
    genre: m.genre,
    durationMinutes: m.durationMinutes,
    posterUrl: poster,
    imagenCard: poster,
    trailerUrl: m.trailerUrl,
    languages: m.languages,
    formats: m.formats,
    releaseDate: m.releaseDate,
    rating: m.rating,
    status: mapStatus(rawStatus),
  };
}

export async function fetchMovies(params?: { status?: MovieStatus; genre?: string; q?: string; page?: number; size?: number; }): Promise<Paginated<Movie>> {
  const response = await api.get<unknown>('/movies', { params });
  const data = response.data as unknown;

  // Defensive handling: backend may return several possible shapes:
  // - paginated: { content: [...] }
  // - plain array: [...] 
  // - wrapped array: { movies: [...] } | { data: [...] } | { results: [...] } | { items: [...] }
  // Normalize all to Paginated<Movie>.
  if (!data) {
    console.warn('fetchMovies: response.data is undefined, returning empty page');
    return { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0, last: true };
  }

  if (Array.isArray(data)) {
    const content = data.map((m: BackendMovieDTO) => mapMovie(m));
    if (import.meta.env.MODE !== 'production') console.debug(`[moviesService] fetchMovies: received array (${content.length})`);
    return { content, page: 0, size: content.length, totalElements: content.length, totalPages: 1, last: true };
  }

  // Common wrappers
  const possibleArrays = ['content', 'movies', 'data', 'results', 'items'];
  const record = (data && typeof data === 'object') ? (data as Record<string, unknown>) : undefined;
  if (record) {
    for (const key of possibleArrays) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        // Try to treat each item as BackendMovieDTO; map defensively
        const arr = candidate as unknown[];
        const content = arr.map((item) => mapMovie(item as BackendMovieDTO));
        if (import.meta.env.MODE !== 'production') console.debug(`[moviesService] fetchMovies: extracted array from key='${key}' (${content.length})`);
        return { content, page: 0, size: content.length, totalElements: content.length, totalPages: 1, last: true };
      }
    }
  }

  // If shape matches BackendPage
  if (Array.isArray((data as BackendPage<BackendMovieDTO>).content)) {
    const pageData = data as BackendPage<BackendMovieDTO>;
    const content = pageData.content.map(mapMovie);
    if (import.meta.env.MODE !== 'production') console.debug(`[moviesService] fetchMovies: paginated content (${content.length}) page=${pageData.number}`);
    return {
      content,
      page: pageData.number ?? 0,
      size: pageData.size ?? content.length,
      totalElements: pageData.totalElements ?? content.length,
      totalPages: pageData.totalPages ?? 1,
      last: pageData.last ?? true,
    };
  }

  console.warn('fetchMovies: unexpected response shape, returning empty page', data);
  return { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0, last: true };
}

export async function fetchAllMovies(): Promise<Movie[]> {
  // Simple helper para componentes que necesitan lista corta
  const page = await fetchMovies({ page: 0, size: 100 });
  return page.content;
}

export const getMovies = fetchAllMovies;

export type Pelicula = Movie;

export default { fetchMovies, fetchAllMovies };
