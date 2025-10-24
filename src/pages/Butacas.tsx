import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieSelection, getSelectedCine } from '../utils/storage';
import { FiX } from 'react-icons/fi';
import type { Seat } from '../types/Seat';
import type { Entrada } from '../types/Ticket';
import { seatService } from '../services/seatService';

const Butacas: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular totales
  const totalEntradas = entradas.reduce((acc, e) => acc + e.cantidad, 0);
  const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const selection = getMovieSelection();
        if (!selection) {
          throw new Error('No se ha seleccionado una película');
        }
        setMovieSelection(selection);

        const savedEntradas = localStorage.getItem('selectedEntradas');
        if (savedEntradas) {
          setEntradas(JSON.parse(savedEntradas));
        }

        const cine = getSelectedCine();
        if (cine) {
          setSelectedCine(cine.name);
          
          // Cargar asientos del showtime seleccionado
          if (selection.showtimeId) {
            const { layout, seats: seatsData } = await seatService.getSeatsByShowtime(selection.showtimeId);
            
            // Crear matriz de asientos basada en el layout
            const seatMatrix: Seat[] = [];
            const rows = Array.from({ length: layout.rows }, (_, i) => 
              String.fromCharCode(65 + i)
            );

            rows.forEach(row => {
              for (let col = 1; col <= layout.columns; col++) {
                const existingSeat = seatsData.find(s => s.row === row && s.number === col);
                if (existingSeat) {
                  seatMatrix.push(existingSeat);
                } else {
                  // Crear asiento vacío si no existe
                  seatMatrix.push({
                    id: -1,
                    row,
                    column: col,
                    number: col,
                    status: 'OCCUPIED',
                    isAvailable: false,
                    isReserved: true,
                    type: 'STANDARD',
                    theaterId: selection.theater?.id || 0,
                    price: 0
                  });
                }
              }
            });

            setSeats(seatMatrix);
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSeatClick = async (seat: Seat) => {
    if (!seat.isAvailable || seat.isReserved) return;

    if (selectedSeats.includes(seat.id)) {
      // Deseleccionar asiento
      setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
      setSeats(seats.map(s => 
        s.id === seat.id ? { ...s, status: 'AVAILABLE' } : s
      ));
      
      // Liberar reserva temporal
      if (movieSelection?.showtimeId) {
        await seatService.releaseSeats(movieSelection.showtimeId, [seat.id]);
      }
    } else if (selectedSeats.length < totalEntradas) {
      // Validar disponibilidad
      if (movieSelection?.showtimeId) {
        const isValid = await seatService.validateSeats(movieSelection.showtimeId, [seat.id]);
        if (!isValid) {
          setError('El asiento ya no está disponible');
          return;
        }

        // Reservar temporalmente
        await seatService.reserveSeats(movieSelection.showtimeId, [seat.id]);
      }

      // Seleccionar asiento
      setSelectedSeats([...selectedSeats, seat.id]);
      setSeats(seats.map(s => 
        s.id === seat.id ? { ...s, status: 'SELECTED' } : s
      ));
    }
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-white border-gray-400';
      case 'OCCUPIED':
      case 'RESERVED': return 'bg-gray-600 border-gray-600 cursor-not-allowed';
      case 'SELECTED': return 'bg-blue-500 border-blue-500';
      default: return 'bg-white border-gray-400';
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === totalEntradas) {
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
      navigate('/carrito/dulceria');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">{error}</div>
      </div>
    );
  }

  // Organizar asientos por filas para la matriz
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row][seat.column - 1] = seat;
    return acc;
  }, {} as Record<string, Seat[]>);

  const rows = Object.keys(seatsByRow).sort();
  const maxColumns = Math.max(...Object.values(seatsByRow).map(row => row.length));

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Selección de Asientos</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex">
        {/* Contenido principal - Selección de asientos */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">SELECCIONA TUS ASIENTOS</h2>
            
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
                gridTemplateRows: `repeat(${rows.length}, 1fr)`,
                height: `${rows.length * 28}px`
              }}>
                {rows.map((row) => (
                  <div key={row} className="w-6 h-7 flex items-center justify-center text-sm font-bold">
                    {row}
                  </div>
                ))}
              </div>
              
              {/* Matriz de asientos */}
              <div className="grid gap-1" style={{ 
                gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
                maxWidth: `${maxColumns * 32}px`
              }}>
                {rows.map(row => 
                  seatsByRow[row].map((seat, index) => (
                    <button
                      key={`${row}${index + 1}`}
                      onClick={() => handleSeatClick(seat)}
                      className={`w-7 h-7 border-2 rounded text-xs font-bold transition-colors ${getSeatColor(seat.status)}`}
                      disabled={!seat.isAvailable || seat.isReserved}
                      title={`Asiento ${seat.row}${seat.number}`}
                    >
                      {seat.number}
                    </button>
                  ))
                )}
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
                  Asientos seleccionados: {selectedSeats
                    .map(id => {
                      const seat = seats.find(s => s.id === id);
                      return seat ? `${seat.row}${seat.number}` : '';
                    })
                    .join(', ')}
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
          {movieSelection?.pelicula && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={movieSelection.pelicula.imagenCard} 
                  alt={movieSelection.pelicula.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{movieSelection.pelicula.titulo.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{movieSelection.selectedFormat} - Doblada</p>
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
                <h5 className="font-medium text-sm">{selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala {movieSelection?.theater?.number || ''}</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {movieSelection?.selectedDay || ''} - {movieSelection?.selectedTime}
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
              onClick={handleContinue}
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
