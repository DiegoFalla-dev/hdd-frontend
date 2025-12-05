import api from './apiClient';
import axios from 'axios';
import type { Showtime } from '../types/Showtime';

interface BackendShowtimeDTO {
  id?: number;
  movieId?: number;
  cinemaId?: number;
  theaterId?: number;
  // Backend returns separate date and time (ShowtimeDto: date(LocalDate) and time(LocalTime))
  date?: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm:ss'
  format?: string;
  language?: string;
  availableSeats?: number;
  totalSeats?: number;
  theaterName?: string;
  price?: number;
}

function mapShowtime(s: BackendShowtimeDTO): Showtime {
  // Normalize backend DTO into frontend Showtime. If backend provides date+time, combine to ISO.
  let startTimeIso: string | undefined = undefined;
  if (s.date && s.time) {
    // ensure time has seconds
    const time = s.time.length === 5 ? `${s.time}:00` : s.time;
    startTimeIso = `${s.date}T${time}`;
  }
  return {
    id: s.id || 0,
    movieId: s.movieId || 0,
    cinemaId: s.cinemaId || 0,
    theaterId: s.theaterId || 0,
    startTime: startTimeIso || '',
    format: s.format,
    language: s.language,
    availableSeats: s.availableSeats,
    totalSeats: s.totalSeats,
    theaterName: s.theaterName,
    price: s.price,
  };
}

export async function getShowtimes(params: { movieId: number; cinemaId: number; date?: string; format?: string; }): Promise<Showtime[]> {
  try {
    // Backend expects query params named `movie` and `cinema` (not movieId/cinemaId)
    const query: Record<string, unknown> = {
      movie: params.movieId,
      cinema: params.cinemaId,
    };
    if (params.date) query.date = params.date; // YYYY-MM-DD
    if (params.format) query.format = params.format; // _2D, _3D, XD
    const resp = await api.get<BackendShowtimeDTO[]>('/showtimes', { params: query });
    // Backend may return three shapes:
    // - list of dates (ShowtimeDto with only `date` populated) -> map to empty startTime but keep date
    // - list of showtimes for a date+format (date,time,format) -> map to startTime ISO
    // - empty array
    if (!Array.isArray(resp.data)) return [];
    return resp.data.map(mapShowtime);
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