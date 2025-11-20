import React from 'react';
import { SeatStatus, type Seat } from '../services/seatsApi';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatIdentifier: string) => void;
  sessionId: string | null;
  timeRemaining: number;
  loading?: boolean;
}

const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onSeatClick,
  sessionId,
  timeRemaining,
  loading = false
}) => {
  // Organizar asientos en matriz por coordenadas
  const organizeSeatsIntoMatrix = (): Seat[][] => {
    if (seats.length === 0) return [];
    
    const maxRow = Math.max(...seats.map(s => s.rowPosition));
    const maxCol = Math.max(...seats.map(s => s.colPosition));
    
    const matrix: Seat[][] = Array(maxRow + 1)
      .fill(null)
      .map(() => Array(maxCol + 1).fill(null));
    
    seats.forEach(seat => {
      matrix[seat.rowPosition][seat.colPosition] = seat;
    });
    
    return matrix;
  };

  const seatMatrix = organizeSeatsIntoMatrix();

  // Determinar el color del asiento según su estado
  const getSeatColor = (seat: Seat): string => {
    // Si está cancelado permanentemente
    if (seat.isCancelled || seat.status === SeatStatus.CANCELLED) {
      return '#1a1a1a'; // Negro - bloqueado
    }

    // Si está seleccionado por este usuario
    if (selectedSeats.includes(seat.seatIdentifier)) {
      return '#BB2228'; // Rojo CinePlus
    }

    // Según el estado
    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        return '#4ade80'; // Verde - disponible
      case SeatStatus.TEMPORARILY_RESERVED:
        // Si es la reserva de este usuario
        if (sessionId && seat.sessionId === sessionId) {
          return '#fbbf24'; // Amarillo - mi reserva temporal
        }
        return '#f97316'; // Naranja - reservado por otro
      case SeatStatus.OCCUPIED:
        return '#6b7280'; // Gris - ocupado
      default:
        return '#4ade80';
    }
  };

  // Determinar si un asiento es clickeable
  const isSeatClickable = (seat: Seat): boolean => {
    // No clickeable si está cancelado
    if (seat.isCancelled || seat.status === SeatStatus.CANCELLED) {
      return false;
    }

    // Clickeable si está disponible
    if (seat.status === SeatStatus.AVAILABLE) {
      return true;
    }

    // Clickeable si es mi selección
    if (selectedSeats.includes(seat.seatIdentifier)) {
      return true;
    }

    // Clickeable si es mi reserva temporal
    if (sessionId && seat.sessionId === sessionId && seat.status === SeatStatus.TEMPORARILY_RESERVED) {
      return true;
    }

    return false;
  };

  // Manejar click en asiento
  const handleSeatClick = (seat: Seat) => {
    if (!isSeatClickable(seat)) return;
    onSeatClick(seat.seatIdentifier);
  };

  // Formatear tiempo restante MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Temporizador de reserva */}
      {sessionId && timeRemaining > 0 && (
        <div 
          className="mb-6 p-4 rounded-lg text-center font-bold text-lg"
          style={{
            background: timeRemaining <= 10 ? '#ef4444' : '#fbbf24',
            color: '#141113',
            animation: timeRemaining <= 10 ? 'pulse 1s infinite' : 'none'
          }}
        >
          ⏱️ Tiempo restante para confirmar: {formatTime(timeRemaining)}
        </div>
      )}

      {/* Pantalla */}
      <div className="mb-8 text-center">
        <div 
          className="mx-auto w-4/5 h-2 rounded-full mb-2"
          style={{ 
            background: 'linear-gradient(to bottom, #393A3A, transparent)',
            boxShadow: '0 4px 20px rgba(187, 34, 40, 0.3)'
          }}
        ></div>
        <p className="text-sm" style={{ color: '#E3E1E2' }}>PANTALLA</p>
      </div>

      {/* Matriz de asientos */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {seatMatrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            {/* Etiqueta de fila */}
            <span 
              className="w-8 text-center font-bold text-sm"
              style={{ color: '#E3E1E2' }}
            >
              {String.fromCharCode(65 + rowIndex)}
            </span>
            
            {/* Asientos de la fila */}
            {row.map((seat, colIndex) => {
              if (!seat) {
                return <div key={colIndex} className="w-10 h-10"></div>;
              }

              const isClickable = isSeatClickable(seat);
              const color = getSeatColor(seat);

              return (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  disabled={!isClickable}
                  className="w-10 h-10 rounded-t-lg transition-all duration-200 text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    color: seat.isCancelled ? '#666' : '#141113',
                    cursor: isClickable ? 'pointer' : 'not-allowed',
                    opacity: seat.isCancelled ? 0.5 : 1,
                    border: selectedSeats.includes(seat.seatIdentifier) 
                      ? '2px solid #EFEFEE' 
                      : '1px solid #393A3A',
                    transform: selectedSeats.includes(seat.seatIdentifier) 
                      ? 'scale(1.1)' 
                      : 'scale(1)'
                  }}
                  title={
                    seat.isCancelled 
                      ? `${seat.seatIdentifier} - Bloqueado` 
                      : `${seat.seatIdentifier} - ${seat.status}`
                  }
                >
                  {colIndex + 1}
                </button>
              );
            })}

            {/* Etiqueta de fila (derecha) */}
            <span 
              className="w-8 text-center font-bold text-sm"
              style={{ color: '#E3E1E2' }}
            >
              {String.fromCharCode(65 + rowIndex)}
            </span>
          </div>
        ))}
      </div>

      {/* Leyenda de estados */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#4ade80' }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#BB2228' }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Tu selección</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#fbbf24' }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Tu reserva temporal</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#f97316' }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Reservado por otro</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#6b7280' }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-t-lg" 
            style={{ backgroundColor: '#1a1a1a', opacity: 0.5 }}
          ></div>
          <span className="text-sm" style={{ color: '#E3E1E2' }}>Bloqueado</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SeatMap;
