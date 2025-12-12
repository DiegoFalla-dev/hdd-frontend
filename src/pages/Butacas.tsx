import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { getMovies, type Pelicula } from "../services/moviesService";
import { useSeats } from "../hooks/useSeats";
import { useShowtimes } from "../hooks/useShowtimes";
import { useSeatSelectionStore } from "../store/seatSelectionStore";
import { useShowtimeSelectionStore } from "../store/showtimeSelectionStore";
import { useOccupiedSeats } from "../hooks/useOccupiedSeats";
import { useSeatOccupancySocket } from "../hooks/useSeatOccupancySocket";
import seatService from "../services/seatService";
import type { TemporarySeatReservationResponse } from "../services/seatService";
import { useToast } from "../components/ToastProvider";
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
// storage util is not required here because we read directly from localStorage (pending cart refactor)

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface LocalSeatUI {
  id: string;
  row: string;
  number: number;
  status: 'available' | 'occupied' | 'selected';
}

// Función generadora de sessionId como fallback si el backend no lo proporciona
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const Butacas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { peliculaId: peliculaIdParam, showtimeId: showtimeIdParam } = useParams();
  const peliculaId = peliculaIdParam || searchParams.get('peliculaId') || searchParams.get('movieId') || undefined;
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [seatMatrix, setSeatMatrix] = useState<'small' | 'medium' | 'large'>('medium');
  const [seats, setSeats] = useState<LocalSeatUI[]>([]);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [expiredHandled, setExpiredHandled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const showtimeSelection = useShowtimeSelectionStore(s => s.selection);
  const seatSelectionStore = useSeatSelectionStore();
  const toast = useToast();
  const purgeExpired = useSeatSelectionStore(s => s.purgeExpired);
  const clearShowtimeFn = useSeatSelectionStore(s => s.clearShowtime);

  const SEAT_MATRICES = {
    small: { rows: 6, cols: 6 },
    medium: { rows: 8, cols: 10 },
    large: { rows: 12, cols: 16 }
  } as const;
  const day = showtimeSelection?.date || searchParams.get('day');
  const time = showtimeSelection?.time || searchParams.get('time');
  const format = showtimeSelection?.format || searchParams.get('format');

  useEffect(() => {
    const savedEntradas = localStorage.getItem("selectedEntradas");
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas));
    if (peliculaId) {
      getMovies().then(m => {
        const f = m.find(x => String(x.id) === peliculaId);
        if (f) setPelicula(f);
      }).catch(()=>{});
    }
  }, [peliculaId]);

  useEffect(() => {
    // Ajuste simple de tamaño según formato (placeholder hasta backend envíe layout)
    if (format?.includes('IMAX')) setSeatMatrix('large');
    else if (format === '3D') setSeatMatrix('large');
    else setSeatMatrix('medium');
  }, [format]);

  // Derivar showtimeId desde query params + seleccion almacenada
  // Derivar cinemaId (en movieSelection puede ser objeto o name); se asume movieSelection.selectedCineData.id si existe
  const cinemaId = showtimeSelection?.cinemaId;
  const showtimesQuery = useShowtimes({ movieId: pelicula ? Number(pelicula.id) : undefined, cinemaId, date: day || undefined });
  // Priorizar showtimeId proveniente de la ruta; si no existe, intentar derivarlo de query params (fallback legacy)
  const matchingShowtime = showtimesQuery.data?.find(st => {
    const localTime = new Date(st.startTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const localDate = new Date(st.startTime).toISOString().split('T')[0];
    return localTime === time && st.format === format && localDate === day;
  });
  const derivedShowtimeId = matchingShowtime?.id;
  const showtimeId = showtimeIdParam ? Number(showtimeIdParam) : (showtimeSelection?.showtimeId || derivedShowtimeId);
  const { data: remoteSeats, isLoading: seatsLoading } = useSeats(showtimeId || undefined);
  const { data: occupiedCodes } = useOccupiedSeats(showtimeId || undefined);
  useSeatOccupancySocket(showtimeId || undefined);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setTicketGroup = useCartStore(s => s.setTicketGroup);

  useEffect(() => {
    if (showtimeId) {
      try {
        // If the showtime selection store exposes a setter, call it (safe optional call)
        (useShowtimeSelectionStore as any).getState()?.setCurrentShowtime?.(showtimeId);
      } catch {}
      purgeExpired();
    }
    // purgeExpired is stable from the store selector
  }, [showtimeId, purgeExpired]);

  // Si no hay asientos persistidos en el backend, generarlos una vez
  useEffect(() => {
    if (!showtimeId) return;
    // Si ya cargamos y no hay remoteSeats, pedir generación en backend
    if (!seatsLoading && (!remoteSeats || remoteSeats.length === 0)) {
      // Evitar generar repetidamente: solo si no existe un flag en localStorage
      const key = `seats:generated:${showtimeId}`;
      if (localStorage.getItem(key)) return;
      seatService.generateSeatsForShowtime(showtimeId)
        .then(() => {
          localStorage.setItem(key, '1');
          // invalidar queries para recargar asientos y ocupados
          queryClient.invalidateQueries({ queryKey: ['showtime', showtimeId, 'seats'] });
          queryClient.invalidateQueries({ queryKey: ['showtime', showtimeId, 'occupiedSeats'] });
        })
        .catch(() => {
          // no hacer nada crítico; se mostrará la matriz local
        });
    }
  }, [showtimeId, remoteSeats, seatsLoading, queryClient]);

  // Countdown expiración
  useEffect(() => {
    if (!showtimeId) return;
    const interval = setInterval(() => {
      const sel = useSeatSelectionStore.getState().selections[showtimeId];
      if (!sel?.expiresAt) {
        setRemainingMs(null);
        return;
      }
      const diff = sel.expiresAt - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
      if (diff <= 0 && !expiredHandled) {
        setExpiredHandled(true);
        const reserved = sel.reservedCodes || [];
        if (reserved.length) {
          seatService.releaseTemporarySeats(showtimeId, reserved).catch(()=>{});
        }
        clearShowtimeFn(showtimeId);
        toast.warning('Tiempo de reserva expirado. Asientos liberados.');
      }
    }, 1000);
    return () => clearInterval(interval);
  // Avoid including the whole store object in deps (would retrigger on any store change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId, expiredHandled, toast]);

  // Si hay asientos remotos, mapearlos al UI local; si no, usar la matriz generada aleatoria como fallback temporal
  useEffect(() => {
    // Construir matriz base (remota futura o fallback local) y overlay ocupados reales
    const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];
    const occupiedSet = new Set(occupiedCodes || []);
    const selectedSet = new Set(showtimeId ? (seatSelectionStore.selections[showtimeId]?.seatCodes || []) : []);
    
    if (remoteSeats && remoteSeats.length) {
      setSeats(remoteSeats.map(s => {
        // prefer backend-provided code (e.g. 'F7'), otherwise build from row+number
        const code = (s as any).code || `${s.row}${s.number}`;
        
        // Determinar el estado del asiento
        let status: 'available' | 'occupied' | 'selected' = 'available';
        
        // Primero verificar si está ocupado en la BD
        if (occupiedSet.has(String(code)) || (s.status && s.status !== 'AVAILABLE')) {
          status = 'occupied';
        } 
        // Luego verificar si está seleccionado localmente (solo si no está ocupado)
        else if (selectedSet.has(String(code))) {
          status = 'selected';
        }
        
        return {
          id: String(code),
          row: s.row,
          number: s.number,
          status
        };
      }));
    } else {
      const matrix = SEAT_MATRICES[seatMatrix];
      const newSeats: LocalSeatUI[] = [];
      for (let r = 0; r < matrix.rows; r++) {
        for (let c = 1; c <= matrix.cols; c++) {
          const seatId = `${rows[r]}${c}`;
          
          // Determinar el estado del asiento
          let status: 'available' | 'occupied' | 'selected' = 'available';
          
          // Primero verificar si está ocupado
          if (occupiedSet.has(seatId)) {
            status = 'occupied';
          }
          // Luego verificar si está seleccionado (solo si no está ocupado)
          else if (selectedSet.has(seatId)) {
            status = 'selected';
          }
          
          newSeats.push({
            id: seatId,
            row: rows[r],
            number: c,
            status
          });
        }
      }
      setSeats(newSeats);
    }
  }, [remoteSeats, seatMatrix, occupiedCodes, showtimeId, seatSelectionStore.selections]);

  // Soporte para cantidad de entradas proveniente de query param 'entradas' (id:qty|id:qty)
  const entradasParam = searchParams.get('entradas');
  const parsedEntradasFromParam = entradasParam ? entradasParam.split('|').map(pair => {
    const [id, qty] = pair.split(':');
    return { id, cantidad: Number(qty) || 0 };
  }) : [];
  const totalEntradas = parsedEntradasFromParam.reduce((acc, e) => acc + e.cantidad, 0) || entradas.reduce((acc, e) => acc + e.cantidad, 0);
  // Comentado: total no se usa
  // const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const selectedSeatCodes = showtimeId ? (seatSelectionStore.selections[showtimeId]?.seatCodes || []) : [];

  // Calcular el total real de entradas: suma de (precio × cantidad) para cada tipo
  // Ejemplo: 2 adultos (45.20) + 1 niño (20.00) = 90.40 + 20.00 = 110.40
  const totalFromEntradas = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);
  
  // Para compatibilidad, mantener unitPrice como fallback
  const fallbackUnitPrice = Number(showtimeSelection?.price ?? matchingShowtime?.price ?? 0);
  const unitPrice = fallbackUnitPrice;
  const seatsCountForTotal = totalEntradas || selectedSeatCodes.length || 0;
  // prefer client-side 'entradas' (selected ticket types/prices) when available, otherwise fall back to showtime price
  const seatsTotal = totalFromEntradas > 0 ? totalFromEntradas : unitPrice * seatsCountForTotal;

  // Concessions and totals (read-only summary)
  const concessions = useCartStore(s => s.concessions);
  const TAX_RATE = 0.18;
  const ticketsSubtotal = totalFromEntradas > 0 ? totalFromEntradas : seatsTotal;
  const concessionsSubtotal = Array.isArray(concessions) ? concessions.reduce((acc, c) => acc + (((c as any).precio ?? (c as any).price ?? 0) * ((c as any).cantidad ?? (c as any).quantity ?? 1)), 0) : 0;
  const igvTotal = Number(((ticketsSubtotal + concessionsSubtotal) * TAX_RATE).toFixed(2));
  const grandTotal = Number((ticketsSubtotal + concessionsSubtotal + igvTotal).toFixed(2));



  const handleSeatClick = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied' || !showtimeId) return;
    
    // Primero hacer el toggle en el store
    seatSelectionStore.toggleSeatCode(showtimeId, seatId, totalEntradas);
    
    // Obtener el estado actualizado después del toggle
    const updatedSelected = seatSelectionStore.selections[showtimeId]?.seatCodes || [];
    
    // Actualizar el estado local de seats inmediatamente para reflejar el cambio
    const occupiedSet = new Set(occupiedCodes || []);
    setSeats(prevSeats => prevSeats.map(s => {
      // Si es un asiento ocupado desde la BD, mantenerlo ocupado
      if (occupiedSet.has(s.id)) {
        return { ...s, status: 'occupied' };
      }
      // Si está en la lista de seleccionados, marcarlo como selected
      if (updatedSelected.includes(s.id)) {
        return { ...s, status: 'selected' };
      }
      // Si no está seleccionado ni ocupado, marcarlo como available
      return { ...s, status: 'available' };
    }));
    
    // Intentar reserva temporal tras cada cambio (solo si hay asientos seleccionados)
    if (updatedSelected.length > 0) {
      seatService.reserveSeatsTemporarily(showtimeId, updatedSelected)
        .then((res: TemporarySeatReservationResponse) => {
          const failed = res.failedCodes || [];
          // Use backend sessionId if provided, otherwise generate one as fallback
          const sessionId = res.sessionId || generateSessionId();
          seatSelectionStore.attachSession(showtimeId, sessionId, res.expiresInMs);
          if (failed.length) {
            seatSelectionStore.applyReservationResult(showtimeId, failed);
            const failedSet = new Set(failed);
            const kept = updatedSelected.filter(c => !failedSet.has(c));
            // Actualizar el estado para reflejar los asientos que fallaron
            setSeats(prevSeats => prevSeats.map(s => {
              const occupiedSet = new Set(occupiedCodes || []);
              if (failedSet.has(s.id) || occupiedSet.has(s.id)) {
                return { ...s, status: 'occupied' };
              }
              const isSelected = kept.includes(s.id);
              return { ...s, status: isSelected ? 'selected' : 'available' };
            }));
            toast.error(`Asientos ocupados: ${failed.join(', ')}`);
          } else {
            seatSelectionStore.applyReservationResult(showtimeId, []);
          }
        })
        .catch(() => {
          // en futuro: toast de error
        });
    }
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300 hover:scale-110 hover:shadow-lg text-gray-800';
      case 'occupied': return 'bg-gradient-to-br from-neutral-700 to-neutral-800 border-neutral-700 cursor-not-allowed opacity-50 text-neutral-500';
      case 'selected': return 'bg-gradient-to-br from-[#BB2228] to-[#8B191E] border-[#BB2228] scale-110 shadow-xl text-white animate-pulse';
      default: return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 text-gray-800';
    }
  };

  const matrix = SEAT_MATRICES[seatMatrix];
  const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      {/* Header mejorado */}
      <div className="flex justify-between items-center p-6 border-b border-white/5 backdrop-blur-sm" style={{ background: 'rgba(57, 58, 58, 0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></div>
          <h1 className="text-2xl font-black">Selección de Asientos</h1>
        </div>
        <button 
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          onClick={() => window.history.back()}
        >
          <FiX size={28} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Contenido principal - Selección de asientos */}
        <div className="flex-1 p-8 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-black mb-8 text-center bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              SELECCIONA TU ASIENTO
            </h2>
            
            {/* Pantalla con diseño mejorado */}
            <div className="mb-12 text-center">
              <div className="relative inline-block">
                <div className="bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 text-black px-12 py-3 rounded-full font-black text-lg shadow-2xl mb-2">
                  PANTALLA
                </div>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BB2228] to-transparent opacity-50"></div>
              </div>
            </div>

            {/* Matriz de asientos con card */}
            <div className="card-glass p-6 rounded-2xl mb-8">
              <div className="flex justify-center items-start gap-4">
                {/* Etiquetas de filas */}
                <div className="grid gap-1" style={{ 
                  gridTemplateRows: `repeat(${matrix.rows}, 1fr)`,
                  height: `${matrix.rows * 28}px`
                }}>
                  {rows.slice(0, matrix.rows).map((row) => (
                    <div key={row} className="w-6 h-7 flex items-center justify-center text-sm font-bold text-neutral-400">
                      {row}
                    </div>
                  ))}
                </div>
                
                {/* Matriz de asientos */}
                <div className="grid gap-1.5" style={{ 
                  gridTemplateColumns: `repeat(${matrix.cols}, 1fr)`,
                  maxWidth: `${matrix.cols * 32}px`
                }}>
                  {seats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id)}
                      className={`w-7 h-7 border-2 rounded-md text-xs font-bold transition-all duration-300 transform ${getSeatColor(seat.status)}`}
                      disabled={seat.status === 'occupied'}
                      title={`Asiento ${seat.id}`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda mejorada */}
            <div className="flex justify-center gap-6 mb-8 card-glass p-4 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-md shadow-sm"></div>
                <span className="text-sm font-semibold">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-neutral-700 to-neutral-800 border-2 border-neutral-700 rounded-md opacity-50"></div>
                <span className="text-sm font-semibold">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#BB2228] to-[#8B191E] border-2 border-[#BB2228] rounded-md shadow-lg"></div>
                <span className="text-sm font-semibold">Seleccionado</span>
              </div>
            </div>

            {/* Información de selección mejorada */}
            {selectedSeatCodes.length > 0 && (
              <div className="text-center card-glass p-6 rounded-xl animate-slide-up">
                <p className="text-xl font-black mb-2">
                  Asientos seleccionados: <span className="text-[#BB2228]">{selectedSeatCodes.join(', ')}</span>
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {selectedSeatCodes.length} de {totalEntradas} asientos
                  </span>
                  {seatsLoading && <span className="text-yellow-400">(cargando...)</span>}
                </div>
                {showtimeId && seatSelectionStore.selections[showtimeId]?.failedCodes?.length ? (
                  <p className="text-xs text-red-400 mt-2 px-3 py-1 bg-red-500/10 rounded-lg inline-block">
                    Fallidos: {seatSelectionStore.selections[showtimeId].failedCodes?.join(', ')}
                  </p>
                ) : null}
                {remainingMs != null && remainingMs > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-yellow-400 font-semibold">
                      Tiempo restante: {Math.floor(remainingMs/1000)}s
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho - Resumen mejorado */}
        <div className="w-full lg:w-96 p-6 border-l border-white/5 animate-slide-up" style={{ background: 'linear-gradient(180deg, rgba(57, 58, 58, 0.3), rgba(57, 58, 58, 0.1))' }}>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
            RESUMEN
          </h3>
          
          {/* Información de la película */}
          {pelicula && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={pelicula.imagenCard} 
                  alt={pelicula.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{(pelicula.titulo ?? pelicula.title ?? '').toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{format} - Doblada</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{showtimeSelection?.cinemaName}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate(day || '')} - {time}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de entradas (vista detallada, no editable) */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Entradas</h4>
            {entradas && entradas.length > 0 ? (
              <div className="space-y-2">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{entrada.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Cantidad: {entrada.cantidad}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">S/ {entrada.precio.toFixed(2)}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Total: S/ {(entrada.precio * entrada.cantidad).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-xs text-gray-400">Asientos seleccionados: {selectedSeatCodes.length ? selectedSeatCodes.join(', ') : '—'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No hay entradas seleccionadas.</div>
            )}

            {/* Dulcería (vista detallada, no editable) */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="font-semibold mb-2">Dulcería</h4>
              {concessions && concessions.length ? (
                <div className="space-y-2">
                  {concessions.map((c: any) => (
                    <div key={c.id ?? c.productId ?? `${c.name}-${c.quantity}`} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.nombre ?? c.name ?? 'Artículo'}</div>
                        <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Cantidad: { (c.cantidad ?? c.quantity ?? 1) }</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">S/ {( (c.precio ?? c.price ?? 0) ).toFixed(2)}</div>
                        <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Total: S/ {(((c.precio ?? c.price ?? 0) * (c.cantidad ?? c.quantity ?? 1))).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Sin artículos en la dulcería.</div>
              )}

              {/* Totales (no editable) */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm"><span>Entradas</span><span>S/ {ticketsSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Dulcería</span><span>S/ {concessionsSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>IGV ({Math.round(TAX_RATE*100)}%)</span><span>S/ {igvTotal.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>S/ {grandTotal.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Total y botón continuar */}
          <div className="mt-auto">
            {/* CONFIRMAR ASIENTOS - reserva/confirmación */}
            {showtimeId && selectedSeatCodes.length === totalEntradas && (
              <button
                className={`mt-0 w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
                  confirmed 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                    : 'btn-secondary-outline hover:scale-105'
                }`}
                disabled={isProcessing || confirmed}
                onClick={async () => {
                  if (!showtimeId) return;
                  setIsProcessing(true);
                  const sel = seatSelectionStore.selections[showtimeId];
                  if (!sel) { setIsProcessing(false); return; }
                  const reserved = new Set(sel.reservedCodes || []);
                  const missing = sel.seatCodes.filter((c: string) => !reserved.has(c));
                  if (missing.length) {
                    try {
                      const res = await seatService.reserveSeatsTemporarily(showtimeId, sel.seatCodes);
                      // Use backend sessionId if provided, otherwise generate one as fallback
                      const sessionId = res.sessionId || generateSessionId();
                      seatSelectionStore.attachSession(showtimeId, sessionId, res.expiresInMs);
                      seatSelectionStore.applyReservationResult(showtimeId, res.failedCodes);
                      if (res.failedCodes && res.failedCodes.length) {
                        toast.error(`No se pudieron reservar: ${res.failedCodes.join(', ')}`);
                        setIsProcessing(false);
                        return;
                      }
                    } catch (e) {
                      toast.error('Error reservando asientos. Intenta nuevamente');
                      setIsProcessing(false);
                      return;
                    }
                  }
                  try {
                    await seatService.confirmSeats(showtimeId, sel.seatCodes);
                    setConfirmed(true);
                    toast.success('Asientos confirmados.');
                    const movieTitleVar = pelicula ? ((pelicula as unknown) as { title?: string; titulo?: string }).title || ((pelicula as unknown) as { titulo?: string }).titulo : undefined;
                    const pendingConfirmed = {
                      showtimeId,
                      movieId: pelicula?.id,
                      movieTitle: movieTitleVar,
                      cinemaId: showtimeSelection?.cinemaId,
                      cinemaName: showtimeSelection?.cinemaName,
                      date: day,
                      time,
                      format,
                      seats: sel.seatCodes,
                      entradas: JSON.parse(localStorage.getItem('selectedEntradas') || '[]'),
                      concessions: useCartStore.getState().concessions,
                      // include reservation session id so payment & backend know the temporary reservation
                      sessionId: sel.sessionId || seatSelectionStore.selections[showtimeId]?.sessionId,
                      pricePerSeat: unitPrice || undefined
                    };
                    try { localStorage.setItem('pendingOrder', JSON.stringify(pendingConfirmed)); } catch (e) { console.warn('Could not persist pendingOrder', e); }
                    // debug: log pendingConfirmed so we can inspect sessionId presence
                    try { console.debug('pendingConfirmed persisted', pendingConfirmed); } catch {}
                    if (pendingConfirmed.showtimeId && pendingConfirmed.seats && pendingConfirmed.seats.length) {
                      setTicketGroup(pendingConfirmed.showtimeId, pendingConfirmed.seats, pendingConfirmed.pricePerSeat || 0, totalFromEntradas);
                    }
                    seatSelectionStore.clearShowtime(showtimeId);
                    // small pause to show green feedback
                    await new Promise(r => setTimeout(r, 300));
                    navigate('/dulceria-carrito');
                  } catch (e) {
                    toast.error('Error confirmando asientos. Reintenta');
                    setIsProcessing(false);
                  }
                }}
              >
                CONFIRMAR ASIENTOS
              </button>
            )}

            {/* CONTINUAR: muestra el subtotal derivado del precio del showtime por asiento */}
            <div 
              className={`mt-4 p-5 rounded-xl flex items-center justify-between transition-all duration-300 shadow-lg ${
                selectedSeatCodes.length === totalEntradas
                  ? 'btn-primary-gradient cursor-pointer hover:scale-105' 
                  : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
              }`}
              onClick={() => {
                if (selectedSeatCodes.length === totalEntradas) {
                  // Guardar pedido pendiente localmente para ser confirmado en la dulcería
                  const movieTitleVar = pelicula ? ((pelicula as unknown) as { title?: string; titulo?: string }).title || ((pelicula as unknown) as { titulo?: string }).titulo : undefined;
                  const pending = {
                    showtimeId,
                    movieId: pelicula?.id,
                    movieTitle: movieTitleVar,
                    cinemaId: showtimeSelection?.cinemaId,
                    cinemaName: showtimeSelection?.cinemaName,
                    date: day,
                    time,
                    format,
                    seats: selectedSeatCodes,
                    entradas: JSON.parse(localStorage.getItem('selectedEntradas') || '[]'),
                    concessions: useCartStore.getState().concessions,
                    // persist reservation session if available (from temporary reserve)
                    sessionId: showtimeId ? seatSelectionStore.selections[showtimeId]?.sessionId : undefined,
                    pricePerSeat: unitPrice || undefined
                  };
                  try { localStorage.setItem('pendingOrder', JSON.stringify(pending)); } catch (e) { console.warn('Could not persist pendingOrder', e); }
                  // debug: log pending object to help trace missing sessionId issues
                  try { console.debug('pending persisted (CONTINUAR)', pending); } catch {}
                  // also populate cart ticket group for payment summary
                  if (pending.showtimeId && pending.seats && pending.seats.length) {
                    setTicketGroup(pending.showtimeId, pending.seats, pending.pricePerSeat || 0, totalFromEntradas);
                  }
                  navigate('/dulceria-carrito');
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  selectedSeatCodes.length === totalEntradas ? 'bg-white/20' : 'bg-gray-600'
                }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-black text-lg">S/ {seatsTotal.toFixed(2)}</span>
              </div>
              <span className="font-black text-lg flex items-center gap-2">
                CONTINUAR
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Butacas;
