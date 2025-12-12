import api from './apiClient';


import type { Seat } from '../types/Seat';
// No existe endpoint de listado completo de asientos aún, se asume que ya fueron generados y que
// el frontend construye la matriz a partir de configuración local + ocupados devueltos.
// Si en el futuro se agrega /api/showtimes/{id}/seats para listado completo, se ajustará aquí.

// BackendSeatDTO removed (not used)

// Assumed endpoint; adjust if backend differs
// Obtener listado de códigos ocupados (e.g. "A10", "B5")
export async function getOccupiedSeatCodes(showtimeId: number): Promise<string[]> {
  const resp = await api.get<string[]>(`/showtimes/${showtimeId}/seats/occupied`);
  return resp.data || [];
}

export async function generateSeatsForShowtime(showtimeId: number): Promise<void> {
  await api.post<void>(`/showtimes/${showtimeId}/seats/generate`);
}

// Reserva temporal de asientos. Devuelve lista de identificadores que FALLARON (conflict)
// Propuesta de respuesta de reserva temporal enriquecida para sessionId
export interface TemporarySeatReservationResponse {
  failedCodes: string[]; // códigos que no se pudieron reservar
  sessionId?: string; // identificador de la reserva temporal (si backend lo soporta)
  expiresInMs?: number; // tiempo restante otorgado por backend
}

export async function reserveSeatsTemporarily(showtimeId: number, seatCodes: string[]): Promise<TemporarySeatReservationResponse> {
  try {
    console.debug('reserveSeatsTemporarily request', { showtimeId, seatCodes });
    const resp = await api.post<TemporarySeatReservationResponse>(`/showtimes/${showtimeId}/seats/reserve`, seatCodes);
    console.debug('reserveSeatsTemporarily response', { status: resp.status, data: resp.data });
    // Compatibilidad: si backend antiguo devuelve solo lista fallidos (array), adaptamos
    if (Array.isArray(resp.data)) {
      return { failedCodes: resp.data } as TemporarySeatReservationResponse;
    }
    return resp.data || { failedCodes: [] };
  } catch (e: any) {
    console.debug('reserveSeatsTemporarily error', { error: e?.response?.data ?? e?.message ?? e });
    if (e?.response?.status === 409) {
      if (Array.isArray(e.response.data)) {
        return { failedCodes: e.response.data };
      }
      if (e.response.data?.failedCodes) {
        return e.response.data as TemporarySeatReservationResponse;
      }
    }
    throw e;
  }
}

export async function releaseTemporarySeats(showtimeId: number, seatCodes: string[]): Promise<void> {
  await api.post<void>(`/showtimes/${showtimeId}/seats/release`, seatCodes);
}

export async function confirmSeats(showtimeId: number, seatCodes: string[]): Promise<void> {
  await api.post<void>(`/showtimes/${showtimeId}/seats/confirm`, seatCodes);
}

// Placeholder para futuro listado completo

// Devuelve asientos de ejemplo para pruebas locales
export async function getSeatsByShowtime(_showtimeId: number): Promise<Seat[]> {
  const seats: Seat[] = [];
  const rows = ['A','B','C','D','E'];
  for (const row of rows) {
    for (let num = 1; num <= 8; num++) {
      seats.push({
        id: `${row}${num}`,
        row,
        number: num,
        status: 'AVAILABLE',
      });
    }
  }
  return seats;
}

export default {
  getOccupiedSeatCodes,
  reserveSeatsTemporarily,
  releaseTemporarySeats,
  confirmSeats,
  getSeatsByShowtime,
  generateSeatsForShowtime,
};
