import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { getMovies, type Pelicula } from "../services/moviesService";
import { useSeatReservation } from "../hooks/useSeatReservation";
import SeatMap from "../components/SeatMap";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import authService from "../services/authService";

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

const Butacas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  
  const peliculaId = searchParams.get('pelicula');
  const day = searchParams.get('day');
  const time = searchParams.get('time');
  const format = searchParams.get('format');

  // Obtener showtimeId desde localStorage (guardado en DetallePelicula)
  const savedShowtimeId = (() => {
    try {
      const ms = localStorage.getItem('movieSelection');
      if (ms) {
        const parsed = JSON.parse(ms);
        // Obtener showtimeId (ID real del backend guardado en DetallePelicula)
        if (parsed?.showtimeId) {
          return Number(parsed.showtimeId);
        }
      }
    } catch (e) {
      console.error('Error parsing movieSelection for showtimeId:', e);
    }
    // Si no hay showtimeId, no se puede continuar
    console.error('❌ showtimeId no encontrado en localStorage. Redirigiendo...');
    alert('Sesión inválida. Por favor, selecciona una película y horario nuevamente.');
    window.location.href = '/cartelera';
    return 1; // Fallback temporal (nunca debería llegar aquí)
  })();

  // Hook del nuevo sistema de reservas v2.0
  const {
    seats,
    selectedSeats,
    sessionId,
    timeRemaining,
    isReserving,
    error,
    loading,
    selectSeat,
    deselectSeat,
    reserveSeats,
    cancelReservation
  } = useSeatReservation({ showtimeId: savedShowtimeId });

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    const savedSelection = localStorage.getItem("movieSelection");
    const savedEntradas = localStorage.getItem("selectedEntradas");
    
    if (savedCine) {
      try { setSelectedCine(JSON.parse(savedCine).name || savedCine); } catch { setSelectedCine(savedCine); }
    }
    if (savedSelection) setMovieSelection(JSON.parse(savedSelection));
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas));

    // If movieSelection contains pelicula, use it; otherwise try to fetch
    const sel = savedSelection ? JSON.parse(savedSelection) : null;
    if (sel?.pelicula) {
      setPelicula(sel.pelicula);
    } else if (peliculaId) {
      getMovies().then(m => {
        const f = m.find(x => x.id === peliculaId);
        if (f) setPelicula(f);
      }).catch(() => {});
    }
  }, [peliculaId]);

  const totalEntradas = entradas.reduce((acc, e) => acc + e.cantidad, 0);

  // Validación: verificar que hay entradas después de cargar (con delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!entradas || entradas.length === 0) {
        alert('No hay entradas seleccionadas. Redirigiendo al carrito de entradas.');
        window.location.href = '/carrito-entradas';
      }
    }, 500); // Dar tiempo a cargar desde localStorage
    
    return () => clearTimeout(timer);
  }, []);
  const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  // Manejar click en asiento (seleccionar/deseleccionar)
  const handleSeatClick = (seatIdentifier: string) => {
    if (selectedSeats.includes(seatIdentifier)) {
      deselectSeat(seatIdentifier);
    } else {
      // Validar límite de entradas
      if (selectedSeats.length >= totalEntradas) {
        alert(`Solo puede seleccionar ${totalEntradas} asiento(s) según sus entradas`);
        return;
      }
      selectSeat(seatIdentifier);
    }
  };

  // Reservar asientos (temporal - 1 minuto)
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) {
      alert('Debe seleccionar al menos un asiento');
      return;
    }

    if (selectedSeats.length !== totalEntradas) {
      alert(`Debe seleccionar exactamente ${totalEntradas} asiento(s)`);
      return;
    }

    // Verificar si el usuario está logueado
    const user = authService.getCurrentUser();
    const userId = user?.id ? Number(user.id) : undefined;

    try {
      await reserveSeats(userId);
      
      // Guardar asientos seleccionados en localStorage para siguiente paso
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
      
      alert('¡Asientos reservados! Tienes 1 minuto para completar la compra.');
    } catch (err) {
      console.error('Error al reservar:', err);
    }
  };

  // Cancelar reserva manualmente
  const handleCancelReservation = async () => {
    if (window.confirm('¿Está seguro de cancelar la reserva?')) {
      await cancelReservation();
      alert('Reserva cancelada');
    }
  };

  // Continuar a dulcería (si hay sessionId activo)
  const handleContinue = () => {
    if (!sessionId) {
      alert('Debe reservar los asientos primero');
      return;
    }

    if (selectedSeats.length !== totalEntradas) {
      alert(`Debe seleccionar exactamente ${totalEntradas} asiento(s)`);
      return;
    }

    // Navegar a dulcería
    window.location.href = `/dulceria-carrito?pelicula=${peliculaId}&day=${day}&time=${time}&format=${format}`;
  };

  if (!entradas || entradas.length === 0) {
    return null;
  }

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      <Navbar />
      
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Selección de Asientos</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Contenido principal - Selección de asientos */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">SELECCIONA TUS ASIENTOS</h2>
            
            {/* Mostrar errores */}
            {error && (
              <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded text-white text-center">
                {error}
              </div>
            )}
            
            {/* Componente SeatMap del nuevo sistema v2.0 */}
            <SeatMap
              seats={seats}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              sessionId={sessionId}
              timeRemaining={timeRemaining}
              loading={loading}
            />

            {/* Información de selección */}
            <div className="text-center mt-6">
              <p className="text-lg font-bold mb-2">
                Asientos seleccionados: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Ninguno'}
              </p>
              <p className="text-sm" style={{ color: '#E3E1E2' }}>
                {selectedSeats.length} de {totalEntradas} asientos seleccionados
              </p>
              
              {/* Botones de acción */}
              <div className="flex gap-4 justify-center mt-6">
                {!sessionId ? (
                  <button
                    onClick={handleReserveSeats}
                    disabled={selectedSeats.length === 0 || selectedSeats.length !== totalEntradas || isReserving}
                    className="px-8 py-3 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: selectedSeats.length === totalEntradas ? '#BB2228' : '#393A3A',
                      color: '#EFEFEE'
                    }}
                  >
                    {isReserving ? 'Reservando...' : 'Reservar Asientos (1 min)'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelReservation}
                      className="px-6 py-3 rounded font-bold transition-colors"
                      style={{ backgroundColor: '#393A3A', color: '#EFEFEE' }}
                    >
                      Cancelar Reserva
                    </button>
                    <button
                      onClick={handleContinue}
                      className="px-8 py-3 rounded font-bold transition-colors"
                      style={{ backgroundColor: '#BB2228', color: '#EFEFEE' }}
                    >
                      Continuar a Dulcería
                    </button>
                  </>
                )}
              </div>

              {sessionId && (
                <p className="text-sm mt-4" style={{ color: '#fbbf24' }}>
                  ⚠️ Los asientos se liberarán automáticamente si no completas la compra
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
          {/* Información de la película */}
          {(movieSelection?.pelicula || pelicula) && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={(movieSelection?.pelicula || pelicula)?.imagenCard} 
                  alt={(movieSelection?.pelicula || pelicula)?.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{(movieSelection?.pelicula || pelicula)?.titulo.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{movieSelection?.selectedFormat || format} - Doblada</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{movieSelection?.selectedCine || selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate((movieSelection?.selectedDay || day) || '')} - {movieSelection?.selectedTime || time}
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
                selectedSeats.length === totalEntradas
                  ? 'bg-white text-black cursor-pointer' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              onClick={() => {
                if (selectedSeats.length === totalEntradas) {
                  localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
                  window.location.href = '/dulceria-carrito';
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${
                  selectedSeats.length === totalEntradas ? 'bg-black' : 'bg-gray-400'
                }`}></div>
                <span className="font-bold">S/ {total.toFixed(2)}</span>
              </div>
              <span className="font-bold">
                TOTAL
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Butacas;
