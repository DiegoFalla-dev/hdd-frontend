import apiClient, { getAuthHeaders } from './apiClient';
import authService from './authService';

/**
 * Interface para la respuesta de funciones del backend
 */
export interface Showtime {
  id: number;
  movieId: number;
  theaterId: number;
  theaterName: string;
  cinemaId: number;
  cinemaName: string;
  date: string; // formato: "YYYY-MM-DD"
  time: string; // formato: "HH:mm:ss"
  format: string; // "_2D" | "_3D" | "XD" | etc.
  availableSeats: number;
  totalSeats: number;
  seatMatrixType: string; // "SMALL" | "MEDIUM" | "LARGE"
}

/**
 * Convierte el formato del frontend ("2D", "3D", "IMAX") al formato del backend ("_2D", "_3D", "XD")
 */
export const formatToBackend = (frontendFormat: string): string => {
  const formatMap: Record<string, string> = {
    '2D': '_2D',
    '3D': '_3D',
    'IMAX': 'XD',
    'XD': 'XD'
  };
  return formatMap[frontendFormat] || frontendFormat;
};

/**
 * Convierte el formato del backend ("_2D", "_3D", "XD") al formato del frontend ("2D", "3D", "IMAX")
 */
export const formatToFrontend = (backendFormat: string): string => {
  const formatMap: Record<string, string> = {
    '_2D': '2D',
    '_3D': '3D',
    'XD': 'IMAX'
  };
  return formatMap[backendFormat] || backendFormat;
};

/**
 * Obtiene las funciones disponibles desde el backend
 * 
 * @param movieId - ID de la película (requerido)
 * @param cinemaId - ID del cine (opcional)
 * @param date - Fecha en formato "YYYY-MM-DD" (opcional)
 * @returns Array de funciones disponibles
 */
export const getShowtimes = async (
  movieId: number,
  cinemaId?: number,
  date?: string
): Promise<Showtime[]> => {
  try {
    const params: Record<string, string | number> = {
      movieId
    };

    if (cinemaId !== undefined) {
      params.cinemaId = cinemaId;
    }

    if (date) {
      params.date = date;
    }

    // Obtener token de autenticación
    const user = authService.getCurrentUser();
    const token = user?.token;

    const response = await apiClient.get<Showtime[]>('/showtimes', {
      params,
      headers: getAuthHeaders(token)
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching showtimes:', error);
    throw new Error('No se pudieron cargar las funciones disponibles. Por favor, intenta de nuevo.');
  }
};

/**
 * Busca una función específica que coincida con los criterios dados
 * 
 * @param showtimes - Array de funciones disponibles
 * @param time - Horario en formato "HH:mm"
 * @param format - Formato del frontend ("2D", "3D", "IMAX")
 * @returns La función encontrada o undefined
 */
export const findMatchingShowtime = (
  showtimes: Showtime[],
  time: string,
  format: string
): Showtime | undefined => {
  const backendFormat = formatToBackend(format);
  
  return showtimes.find(st => 
    st.time.substring(0, 5) === time && st.format === backendFormat
  );
};

export default {
  getShowtimes,
  findMatchingShowtime,
  formatToBackend,
  formatToFrontend
};
