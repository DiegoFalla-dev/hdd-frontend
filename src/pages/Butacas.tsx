import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { getMovies, type Pelicula } from "../services/moviesService";
// storage util is not required here because we read directly from localStorage

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Seat {
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

function getMovieShowtimes(_cine: string | null, _peliculaId: string | null) {
  // Stubbed function: return a few example showtimes. In the real app this
  // would come from backend or a shared data module. We keep a deterministic
  // mapping so seatMatrix may change depending on time/format.
  return [
    { date: '2025-10-24', time: '18:00', format: '2D', seatMatrix: 'medium' as SeatMatrixKey },
    { date: '2025-10-24', time: '20:00', format: '3D', seatMatrix: 'large' as SeatMatrixKey }
  ];
}

const Butacas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatMatrix, setSeatMatrix] = useState<SeatMatrixKey>('medium');
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  
  const peliculaId = searchParams.get('pelicula');
  const day = searchParams.get('day');
  const time = searchParams.get('time');
  const format = searchParams.get('format');

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

  useEffect(() => {
    // Determinar matriz de asientos basada en el showtime
    if ((movieSelection?.selectedCine || selectedCine) && peliculaId && day && time && format) {
      const showtimes = getMovieShowtimes(movieSelection?.selectedCine || selectedCine, peliculaId);
      const showtime = showtimes.find((s:any) => s.date === day && s.time === time && s.format === format);
      if (showtime) {
        setSeatMatrix(showtime.seatMatrix as SeatMatrixKey);
      }
    }
  }, [selectedCine, peliculaId, day, time, format, movieSelection]);

  useEffect(() => {
    // Generar matriz de asientos
    const matrix = SEAT_MATRICES[seatMatrix];
    const newSeats: Seat[] = [];
    const rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];
    
    for (let row = 0; row < matrix.rows; row++) {
      for (let col = 1; col <= matrix.cols; col++) {
        const seatId = `${rows[row]}${col}`;
        const isOccupied = Math.random() < 0.3; // 30% ocupados aleatoriamente
        
        newSeats.push({
          id: seatId,
          row: rows[row],
          number: col,
          status: isOccupied ? 'occupied' : 'available'
        });
      }
    }
    
    setSeats(newSeats);
  }, [seatMatrix]);

  const totalEntradas = entradas.reduce((acc, e) => acc + e.cantidad, 0);
  const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const handleSeatClick = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied') return;

    if (selectedSeats.includes(seatId)) {
      // Deseleccionar asiento
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      setSeats(seats.map(s => 
        s.id === seatId ? { ...s, status: 'available' } : s
      ));
    } else if (selectedSeats.length < totalEntradas) {
      // Seleccionar asiento
      setSelectedSeats([...selectedSeats, seatId]);
      setSeats(seats.map(s => 
        s.id === seatId ? { ...s, status: 'selected' } : s
      ));
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
            {selectedSeats.length > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold">
                  Asientos seleccionados: {selectedSeats.join(', ')}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedSeats.length} de {totalEntradas} asientos seleccionados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
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
              <div className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-1"></div>
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
                CONTINUAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Butacas;
