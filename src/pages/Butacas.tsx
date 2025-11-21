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

type SeatMatrixKey = 'small' | 'medium' | 'large' | 'xlarge';

const SEAT_MATRICES: Record<SeatMatrixKey, { rows: number; cols: number }> = {
  small: { rows: 6, cols: 8 },
  medium: { rows: 8, cols: 10 },
  large: { rows: 12, cols: 12 },
  xlarge: { rows: 15, cols: 14 }
};

// Eliminado getMovieShowtimes: ahora derivamos showtime real vía hook useShowtimes

const Butacas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [seats, setSeats] = useState<LocalSeatUI[]>([]);
  const seatSelectionStore = useSeatSelectionStore();
  const setCurrentShowtime = useSeatSelectionStore(s => s.setCurrentShowtime);
  const purgeExpired = useSeatSelectionStore(s => s.purgeExpired);
  const clearShowtimeFn = useSeatSelectionStore(s => s.clearShowtime);
  const showtimeSelection = useShowtimeSelectionStore(s => s.selection);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [expiredHandled, setExpiredHandled] = useState(false);
  const [seatMatrix, setSeatMatrix] = useState<SeatMatrixKey>('medium');
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const toast = useToast();
  
  const { showtimeId: showtimeIdParam } = useParams();
  const peliculaId = showtimeSelection?.movieId ? String(showtimeSelection.movieId) : searchParams.get('pelicula');
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
      setCurrentShowtime(showtimeId);
      purgeExpired();
    }
  }, [showtimeId, setCurrentShowtime, purgeExpired]);

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
    if (remoteSeats && remoteSeats.length) {
      setSeats(remoteSeats.map(s => ({
        id: String(s.id),
        row: s.row,
        number: s.number,
        status: occupiedSet.has(String(s.id)) || s.status !== 'AVAILABLE' ? 'occupied' : 'available'
      })));
    } else {
      const matrix = SEAT_MATRICES[seatMatrix];
      const newSeats: LocalSeatUI[] = [];
      for (let r = 0; r < matrix.rows; r++) {
        for (let c = 1; c <= matrix.cols; c++) {
          const seatId = `${rows[r]}${c}`;
          newSeats.push({
            id: seatId,
            row: rows[r],
            number: c,
            status: occupiedSet.has(seatId) ? 'occupied' : 'available'
          });
        }
      }
      setSeats(newSeats);
    }
  }, [remoteSeats, seatMatrix, occupiedCodes]);

  // Soporte para cantidad de entradas proveniente de query param 'entradas' (id:qty|id:qty)
  const entradasParam = searchParams.get('entradas');
  const parsedEntradasFromParam = entradasParam ? entradasParam.split('|').map(pair => {
    const [id, qty] = pair.split(':');
    return { id, cantidad: Number(qty) || 0 };
  }) : [];
  const totalEntradas = parsedEntradasFromParam.reduce((acc, e) => acc + e.cantidad, 0) || entradas.reduce((acc, e) => acc + e.cantidad, 0);
  const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const selectedSeatCodes = showtimeId ? (seatSelectionStore.selections[showtimeId]?.seatCodes || []) : [];

  const handleSeatClick = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied' || !showtimeId) return;
    seatSelectionStore.toggleSeatCode(showtimeId, seatId, totalEntradas);
    // reflect UI status update
    const updatedSelected = showtimeId ? seatSelectionStore.selections[showtimeId]?.seatCodes || [] : [];
    setSeats(seats.map(s => {
      if (s.id === seatId) {
        const isSelected = updatedSelected.includes(seatId);
        return { ...s, status: isSelected ? 'selected' : 'available' };
      }
      if (s.status === 'selected' && !updatedSelected.includes(s.id)) {
        return { ...s, status: 'available' };
      }
      return s;
    }));
    // Intentar reserva temporal tras cada cambio (optimización futura: sólo on add)
    if (updatedSelected.length) {
      seatService.reserveSeatsTemporarily(showtimeId, updatedSelected)
        .then((res: TemporarySeatReservationResponse) => {
          const failed = res.failedCodes || [];
          if (res.sessionId) {
            seatSelectionStore.attachSession(showtimeId, res.sessionId, res.expiresInMs);
          }
          if (failed.length) {
            seatSelectionStore.applyReservationResult(showtimeId, failed);
            const failedSet = new Set(failed);
            const kept = updatedSelected.filter(c => !failedSet.has(c));
            setSeats(seats.map(s => {
              if (failedSet.has(s.id)) {
                return { ...s, status: 'occupied' };
              }
              const isSelected = kept.includes(s.id);
              return { ...s, status: isSelected ? 'selected' : s.status };
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
      case 'available': return 'bg-white border-gray-400';
      case 'occupied': return 'bg-gray-600 border-gray-600 cursor-not-allowed';
      case 'selected': return 'bg-blue-500 border-blue-500';
      default: return 'bg-white border-gray-400';
    }
  };

  const matrix = SEAT_MATRICES[seatMatrix];
  const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Entradas</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex">
        {/* Contenido principal - Selección de asientos */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">SELECCIONA TU ASIENTO</h2>
            
            {/* Pantalla */}
            <div className="mb-8 text-center">
              <div className="inline-block bg-gray-300 text-black px-8 py-2 rounded-full font-bold mb-4">
                PANTALLA
              </div>
            </div>

            {/* Matriz de asientos */}
            <div className="mb-8 flex justify-center items-start gap-4">
              {/* Etiquetas de filas */}
              <div className="grid gap-1" style={{ 
                gridTemplateRows: `repeat(${matrix.rows}, 1fr)`,
                height: `${matrix.rows * 28}px`
              }}>
                {rows.slice(0, matrix.rows).map((row) => (
                  <div key={row} className="w-6 h-7 flex items-center justify-center text-sm font-bold">
                    {row}
                  </div>
                ))}
              </div>
              
              {/* Matriz de asientos */}
              <div className="grid gap-1" style={{ 
                gridTemplateColumns: `repeat(${matrix.cols}, 1fr)`,
                maxWidth: `${matrix.cols * 32}px`
              }}>
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id)}
                    className={`w-7 h-7 border-2 rounded text-xs font-bold transition-colors ${getSeatColor(seat.status)}`}
                    disabled={seat.status === 'occupied'}
                    title={`Asiento ${seat.id}`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded"></div>
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 border-2 border-gray-600 rounded"></div>
                <span className="text-sm">No disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 border-2 border-blue-500 rounded"></div>
                <span className="text-sm">Seleccionado</span>
              </div>
            </div>

            {/* Información de selección */}
            {selectedSeatCodes.length > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold">
                  Asientos seleccionados: {selectedSeatCodes.join(', ')}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedSeatCodes.length} de {totalEntradas} asientos seleccionados {seatsLoading ? '(cargando asientos...)' : ''}
                </p>
                {showtimeId && seatSelectionStore.selections[showtimeId]?.failedCodes?.length ? (
                  <p className="text-xs text-red-400">
                    Fallidos: {seatSelectionStore.selections[showtimeId].failedCodes?.join(', ')}
                  </p>
                ) : null}
                {remainingMs != null && remainingMs > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Tiempo restante: {Math.floor(remainingMs/1000)}s
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
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

          {/* Lista de entradas */}
          {entradas.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Entradas</h4>
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded"></div>
                    <div>
                      <div className="text-sm font-medium">{entrada.cantidad} - {entrada.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {entrada.precio.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cargo por servicio */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Cargo por servicio online</div>
                    <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Incluye el cargo por servicio online</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <div 
              className={`p-4 rounded flex items-center justify-between ${
                selectedSeatCodes.length === totalEntradas
                  ? 'bg-white text-black cursor-pointer' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
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
                    pricePerSeat: showtimeSelection?.price || undefined
                  };
                  try { localStorage.setItem('pendingOrder', JSON.stringify(pending)); } catch (e) { console.warn('Could not persist pendingOrder', e); }
                  // also populate cart ticket group for payment summary
                  if (pending.showtimeId && pending.seats && pending.seats.length) {
                    setTicketGroup(pending.showtimeId, pending.seats, pending.pricePerSeat || 0);
                  }
                  navigate('/dulceria-carrito');
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${
                  selectedSeatCodes.length === totalEntradas ? 'bg-black' : 'bg-gray-400'
                }`}></div>
                <span className="font-bold">S/ {total.toFixed(2)}</span>
              </div>
              <span className="font-bold">
                CONTINUAR
              </span>
            </div>
              {/* Botón confirmar asientos (persistencia final) */}
              {showtimeId && selectedSeatCodes.length === totalEntradas && (
                <button
                  className="mt-4 w-full border border-blue-500 text-blue-500 py-2 rounded hover:bg-blue-500 hover:text-black transition-colors text-sm font-semibold"
                  onClick={async () => {
                    const sel = seatSelectionStore.selections[showtimeId];
                    if (!sel) return;
                    // Asegurar que todos estén reservados: reservar faltantes
                    const reserved = new Set(sel.reservedCodes || []);
                    const missing = sel.seatCodes.filter(c => !reserved.has(c));
                    if (missing.length) {
                      try {
                        const res = await seatService.reserveSeatsTemporarily(showtimeId, sel.seatCodes);
                        if (res.sessionId) {
                          seatSelectionStore.attachSession(showtimeId, res.sessionId, res.expiresInMs);
                        }
                        seatSelectionStore.applyReservationResult(showtimeId, res.failedCodes);
                        if (res.failedCodes.length) {
                          toast.error(`No se pudieron reservar: ${res.failedCodes.join(', ')}`);
                          return;
                        }
                      } catch {
                        toast.error('Error reservando asientos. Intenta nuevamente');
                        return;
                      }
                    }
                    // Confirmar
                    try {
                      await seatService.confirmSeats(showtimeId, sel.seatCodes);
                      toast.success('Asientos confirmados.');
                      // Guardar selección confirmada y pasar a siguiente etapa
                      // Persistencia futura: almacenar sessionId y confirmación; evitar confirmedSeats localStorage
                      // Opcional: limpiar selección temporal
                      // Build pending order from confirmed seats
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
                        pricePerSeat: showtimeSelection?.price || undefined
                      };
                      try { localStorage.setItem('pendingOrder', JSON.stringify(pendingConfirmed)); } catch (e) { console.warn('Could not persist pendingOrder', e); }
                      // populate cart ticket group
                      if (pendingConfirmed.showtimeId && pendingConfirmed.seats && pendingConfirmed.seats.length) {
                        setTicketGroup(pendingConfirmed.showtimeId, pendingConfirmed.seats, pendingConfirmed.pricePerSeat || 0);
                      }
                      seatSelectionStore.clearShowtime(showtimeId);
                      navigate('/dulceria-carrito');
                    } catch {
                      toast.error('Error confirmando asientos. Reintenta');
                    }
                  }}
                >
                  CONFIRMAR ASIENTOS
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Butacas;
