import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { peliculas } from "../data/peliculas";
import { FiX } from "react-icons/fi";

const SeleccionBoletos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  
  const peliculaId = searchParams.get('pelicula');
  const day = searchParams.get('day');
  const time = searchParams.get('time');
  const format = searchParams.get('format');
  
  const pelicula = peliculas.find(p => p.id === peliculaId);

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    if (savedCine) {
      setSelectedCine(savedCine);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  if (!pelicula) {
    return (
      <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
        <Navbar variant="boletos" />
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Película no encontrada</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header con título de Entradas */}
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
        {/* Contenido principal */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">¡EXCELENTE ELECCIÓN! YA FALTA MENOS PARA TU PRÓXIMA VISITA</h2>
            <p className="text-sm mb-8" style={{ color: "var(--cineplus-gray)" }}>
              Estás a unos pocos pasos de tener una gran experiencia.
            </p>
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
          {/* Información de la película */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Película</h4>
            <div className="flex gap-3">
              <img 
                src={pelicula.imagenCard} 
                alt={pelicula.titulo}
                className="w-12 h-16 object-cover rounded"
              />
              <div>
                <h5 className="font-medium text-sm">{pelicula.titulo.toUpperCase()}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{format} - Doblada</p>
              </div>
            </div>
          </div>

          {/* Información del cine y horario */}
          <div className="mb-8">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  Sala 6
                </p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate(day || '')} - {time}
                </p>
              </div>
            </div>
          </div>

          {/* Botón Continuar */}
          <button 
            className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
            onClick={() => window.location.href = '/carrito'}
          >
            CONTINUAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeleccionBoletos;
