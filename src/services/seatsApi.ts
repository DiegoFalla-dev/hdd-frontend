import apiClient from './apiClient';

// Tipos para el sistema de butacas v2.0
export const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  TEMPORARILY_RESERVED: 'TEMPORARILY_RESERVED',
  OCCUPIED: 'OCCUPIED',
  CANCELLED: 'CANCELLED'
} as const;

export type SeatStatusType = typeof SeatStatus[keyof typeof SeatStatus];

export interface Seat {
  id: number;
  seatIdentifier: string;
  status: SeatStatusType;
  rowPosition: number;
  colPosition: number;
  isCancelled: boolean;
  sessionId: string | null;
  purchaseNumber: string | null;
}

export interface ReservationRequest {
  seatIdentifiers: string[];
  userId?: number;
}

export interface ReservationResponse {
  sessionId: string;
  message: string;
}

export interface ConfirmationRequest {
  sessionId: string;
  purchaseNumber: string;
}

export interface CancellationRequest {
  seatIdentifiers: string[];
  purchaseNumber: string;
}

export interface ReleaseRequest {
  seatIdentifiers: string[];
}

// 1. Iniciar Reserva de Asientos (Temporal - 1 minuto)
export const initiateReservation = async (
  showtimeId: number,
  request: ReservationRequest
): Promise<ReservationResponse> => {
  const response = await apiClient.post(
    `/seat-reservations/${showtimeId}`,
    request
  );
  return response.data;
};

// 2. Confirmar Compra (Convierte TEMPORARILY_RESERVED a OCCUPIED)
export const confirmPurchase = async (
  request: ConfirmationRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    '/seat-reservations/confirm',
    request
  );
  return response.data;
};

// 3. Liberar Reserva Manualmente (antes de expiración)
export const releaseReservation = async (sessionId: string): Promise<void> => {
  await apiClient.delete(`/seat-reservations/${sessionId}`);
};

// 4. Cancelar Asientos Permanentemente (CANCELLED - bloqueado)
export const cancelSeats = async (
  showtimeId: number,
  request: CancellationRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/seat-reservations/cancel/${showtimeId}`,
    request
  );
  return response.data;
};

// 5. Liberar Asientos Ocupados (OCCUPIED sin purchaseNumber)
export const releaseOccupiedSeats = async (
  showtimeId: number,
  request: ReleaseRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/seat-reservations/release-occupied/${showtimeId}`,
    request
  );
  return response.data;
};

// 6. Obtener Matriz de Asientos (con coordenadas y estados)
export const getSeatMatrix = async (showtimeId: number): Promise<Seat[]> => {
  const response = await apiClient.get(
    `/seat-reservations/${showtimeId}/matrix`
  );
  return response.data;
};

// 7. Obtener Asientos de una Sesión (por sessionId)
export const getSessionSeats = async (sessionId: string): Promise<string[]> => {
  const response = await apiClient.get(
    `/seat-reservations/${sessionId}/seats`
  );
  return response.data;
};

// Utilidades para manejo de sesiones
export const saveSessionId = (sessionId: string): void => {
  localStorage.setItem('cineplus:sessionId', sessionId);
};

export const getSessionId = (): string | null => {
  return localStorage.getItem('cineplus:sessionId');
};

export const clearSessionId = (): void => {
  localStorage.removeItem('cineplus:sessionId');
};

export const saveReservationExpiry = (expiryTime: Date): void => {
  localStorage.setItem('cineplus:reservationExpiry', expiryTime.toISOString());
};

export const getReservationExpiry = (): Date | null => {
  const expiry = localStorage.getItem('cineplus:reservationExpiry');
  return expiry ? new Date(expiry) : null;
};

export const clearReservationExpiry = (): void => {
  localStorage.removeItem('cineplus:reservationExpiry');
};

// Limpiar toda la sesión de reserva
export const clearReservationSession = (): void => {
  clearSessionId();
  clearReservationExpiry();
};
