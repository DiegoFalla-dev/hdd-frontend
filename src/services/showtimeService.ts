import api from './apiClient';
import axios from 'axios';
import type { Showtime } from '../types/Showtime';

interface BackendShowtimeDTO {
  id: number;
  movieId: number;
  cinemaId: number;
  theaterId: number;
  startTime: string; // ISO
  format?: string;
  language?: string;
  availableSeats?: number;
  totalSeats?: number;
}

function mapShowtime(s: BackendShowtimeDTO): Showtime {
  return {
    id: s.id,
    movieId: s.movieId,
    cinemaId: s.cinemaId,
    theaterId: s.theaterId,
    startTime: s.startTime,
    format: s.format,
    language: s.language,
    availableSeats: s.availableSeats,
    totalSeats: s.totalSeats,
  };
}

export async function getShowtimes(params: { movieId: number; cinemaId: number; date: string; }): Promise<Showtime[]> {
  try {
    const resp = await api.get<BackendShowtimeDTO[]>('/showtimes', { params });
    return Array.isArray(resp.data) ? resp.data.map(mapShowtime) : [];
  } catch (error) {
    // If the user is not authenticated, trigger the login/register modal and return empty list
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { reason: 'unauthorized' } }));
      } catch (_e) {
        // noop if window not available
      }
      return [];
    }
    throw error;
  }
}

export default { getShowtimes };