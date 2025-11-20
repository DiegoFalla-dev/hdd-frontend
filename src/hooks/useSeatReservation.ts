import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateReservation,
  confirmPurchase,
  releaseReservation,
  getSeatMatrix,
  getSessionSeats,
  saveSessionId,
  getSessionId,
  saveReservationExpiry,
  getReservationExpiry,
  clearReservationSession,
  SeatStatus,
  type Seat,
  type ReservationRequest,
  type ConfirmationRequest
} from '../services/seatsApi';

const RESERVATION_DURATION_MS = 60000; // 1 minuto

interface UseSeatReservationProps {
  showtimeId: number;
}

interface UseSeatReservationReturn {
  seats: Seat[];
  selectedSeats: string[];
  sessionId: string | null;
  timeRemaining: number;
  isReserving: boolean;
  isConfirming: boolean;
  error: string | null;
  loading: boolean;
  selectSeat: (seatIdentifier: string) => void;
  deselectSeat: (seatIdentifier: string) => void;
  reserveSeats: (userId?: number) => Promise<void>;
  confirmReservation: (purchaseNumber: string) => Promise<void>;
  cancelReservation: () => Promise<void>;
  refreshSeats: () => Promise<void>;
}

export const useSeatReservation = ({
  showtimeId
}: UseSeatReservationProps): UseSeatReservationReturn => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isReserving, setIsReserving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const expiryRef = useRef<Date | null>(null);

  // Cargar matriz de asientos
  const refreshSeats = useCallback(async () => {
    try {
      setLoading(true);
      const matrix = await getSeatMatrix(showtimeId);
      setSeats(matrix);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar asientos');
      console.error('Error loading seats:', err);
    } finally {
      setLoading(false);
    }
  }, [showtimeId]);

  // Cargar asientos al montar
  useEffect(() => {
    refreshSeats();
  }, [refreshSeats]);

  // Restaurar sesión activa desde localStorage
  useEffect(() => {
    const savedSessionId = getSessionId();
    const savedExpiry = getReservationExpiry();

    if (savedSessionId && savedExpiry) {
      const now = new Date();
      const expiry = new Date(savedExpiry);
      
      if (expiry > now) {
        // Sesión válida, restaurar
        setSessionId(savedSessionId);
        expiryRef.current = expiry;
        
        // Cargar asientos de esta sesión
        getSessionSeats(savedSessionId).then(seatIds => {
          setSelectedSeats(seatIds);
        }).catch(() => {
          // Si falla, limpiar sesión
          clearReservationSession();
        });
      } else {
        // Sesión expirada, limpiar
        clearReservationSession();
      }
    }
  }, []);

  // Temporizador de cuenta regresiva
  useEffect(() => {
    if (!expiryRef.current) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, expiryRef.current!.getTime() - now.getTime());
      setTimeRemaining(Math.ceil(remaining / 1000)); // segundos

      if (remaining <= 0) {
        // Expiró
        clearReservationSession();
        setSessionId(null);
        setSelectedSeats([]);
        expiryRef.current = null;
        refreshSeats();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    updateTimer();
    timerRef.current = window.setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId, refreshSeats]);

  // Seleccionar asiento
  const selectSeat = useCallback((seatIdentifier: string) => {
    const seat = seats.find(s => s.seatIdentifier === seatIdentifier);
    
    if (!seat) return;
    
    // Solo permitir selección si está disponible
    if (seat.status !== SeatStatus.AVAILABLE) {
      setError(`El asiento ${seatIdentifier} no está disponible`);
      return;
    }

    if (seat.isCancelled) {
      setError(`El asiento ${seatIdentifier} está bloqueado permanentemente`);
      return;
    }

    if (!selectedSeats.includes(seatIdentifier)) {
      setSelectedSeats(prev => [...prev, seatIdentifier]);
      setError(null);
    }
  }, [seats, selectedSeats]);

  // Deseleccionar asiento
  const deselectSeat = useCallback((seatIdentifier: string) => {
    setSelectedSeats(prev => prev.filter(id => id !== seatIdentifier));
  }, []);

  // Reservar asientos (temporal - 1 minuto)
  const reserveSeats = useCallback(async (userId?: number) => {
    if (selectedSeats.length === 0) {
      setError('Debe seleccionar al menos un asiento');
      return;
    }

    try {
      setIsReserving(true);
      setError(null);

      const request: ReservationRequest = {
        seatIdentifiers: selectedSeats,
        userId
      };

      const response = await initiateReservation(showtimeId, request);
      
      // Guardar sessionId y tiempo de expiración
      setSessionId(response.sessionId);
      saveSessionId(response.sessionId);
      
      const expiryTime = new Date(Date.now() + RESERVATION_DURATION_MS);
      expiryRef.current = expiryTime;
      saveReservationExpiry(expiryTime);

      // Refrescar matriz para ver asientos reservados
      await refreshSeats();
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al reservar asientos';
      setError(errorMsg);
      console.error('Error reserving seats:', err);
      
      // Si algún asiento ya fue tomado, refrescar matriz
      if (err.response?.status === 400 || err.response?.status === 409) {
        await refreshSeats();
      }
    } finally {
      setIsReserving(false);
    }
  }, [showtimeId, selectedSeats, refreshSeats]);

  // Confirmar compra (convierte a OCCUPIED)
  const confirmReservation = useCallback(async (purchaseNumber: string) => {
    if (!sessionId) {
      setError('No hay una reserva activa');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);

      const request: ConfirmationRequest = {
        sessionId,
        purchaseNumber
      };

      await confirmPurchase(request);
      
      // Limpiar sesión después de confirmar
      clearReservationSession();
      setSessionId(null);
      setSelectedSeats([]);
      expiryRef.current = null;
      setTimeRemaining(0);

      // Refrescar matriz
      await refreshSeats();
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al confirmar compra';
      setError(errorMsg);
      console.error('Error confirming purchase:', err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  }, [sessionId, refreshSeats]);

  // Cancelar reserva manualmente
  const cancelReservation = useCallback(async () => {
    if (!sessionId) return;

    try {
      await releaseReservation(sessionId);
      
      // Limpiar sesión
      clearReservationSession();
      setSessionId(null);
      setSelectedSeats([]);
      expiryRef.current = null;
      setTimeRemaining(0);

      // Refrescar matriz
      await refreshSeats();
      
    } catch (err: any) {
      console.error('Error canceling reservation:', err);
      // Limpiar de todas formas
      clearReservationSession();
      setSessionId(null);
      setSelectedSeats([]);
      expiryRef.current = null;
    }
  }, [sessionId, refreshSeats]);

  return {
    seats,
    selectedSeats,
    sessionId,
    timeRemaining,
    isReserving,
    isConfirming,
    error,
    loading,
    selectSeat,
    deselectSeat,
    reserveSeats,
    confirmReservation,
    cancelReservation,
    refreshSeats
  };
};
