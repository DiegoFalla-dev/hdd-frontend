import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SideModal from "../components/SideModal";
import { peliculas } from "../data/peliculas";
import type { Pelicula } from "../data/peliculas";
import { getAvailableDates, getMovieShowtimes, getAvailableTimes } from "../data/cinemasSchedule";
import type { Showtime as CSShowtime } from "../data/cinemasSchedule";
import { FiPlay } from "react-icons/fi";

const cines = [
  "Cineplus Asia",
  "Cineplus Gamarra", 
  "Cineplus Jockey Plaza",
  "Cineplus Lambramani",
  "Cineplus Mall Ave Pza Arequipa",
  "Cineplus MallPlaza Angamos",
  "Cineplus Mallplaza Bellavista",
];

const DetallePelicula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const peliculaId = searchParams.get('pelicula');
  
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [showtimes, setShowtimes] = useState<CSShowtime[]>([]);

  useEffect(() => {
    // Use local peliculas data as source of truth
    setPelicula(peliculas.find(p => p.id === peliculaId) || null);
  }, [peliculaId]);

  useEffect(() => {
    (async () => {
      if (!peliculaId) return;
      // Use local schedule generator
      setShowtimes(selectedCine ? getMovieShowtimes(selectedCine, peliculaId) : []);
    })();
  }, [peliculaId, selectedCine]);

  // Get dynamic dates and showtimes
  const availableDates = getAvailableDates(peliculaId || undefined);
  const availableFormats = [...new Set((showtimes as unknown as CSShowtime[]).map((s) => s.format || '2D'))] as string[];
  const availableTimes = selectedDay && selectedFormat ? 
    getAvailableTimes(showtimes as unknown as CSShowtime[], selectedDay, selectedFormat) : [];

  const isReadyToBuy = selectedDay && selectedTime && selectedFormat;

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    if (savedCine) {
      setSelectedCine(savedCine);
    }
  }, []);

  const handleCineSelection = (cine: string) => {
    setSelectedCine(cine);
    localStorage.setItem("selectedCine", cine);
  };

  if (!pelicula) {
    return (
      <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Película no encontrada</h2>
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedCine) {
    return (
      <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda - Skeleton */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <div className="w-full h-96 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-6 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div>
                  <div className="w-32 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-8 h-6 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div>
                  <div className="w-20 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div>
                  <div className="w-28 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div>
                  <div className="w-24 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Columna derecha - Skeleton */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="w-3/4 h-10 bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="w-full h-64 bg-gray-700 rounded-lg mb-6 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-full h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <div className="w-24 h-8 bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="flex gap-2 mb-4">
                  <div className="w-12 h-8 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div className="mb-6">
                  <div className="w-40 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="w-32 h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-48 h-6 bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="w-full h-4 bg-gray-700 rounded mb-4 animate-pulse"></div>
                  
                  <div className="w-8 h-4 bg-gray-700 rounded mb-4 animate-pulse"></div>
                  
                  <div className="flex gap-2 mb-6">
                    <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="w-full h-12 bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="w-full h-12 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SideModal 
          isOpen={!selectedCine}
          onClose={() => {}}
          title="Elige tu cine"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--cineplus-gray)" }}>Selecciona tu cine favorito</h3>
            <p className="text-xs mb-4" style={{ color: "var(--cineplus-gray)" }}>Ordenado alfabéticamente</p>
          </div>

          <div className="space-y-3">
            {cines.map((cine) => (
              <div 
                key={cine}
                onClick={() => handleCineSelection(cine)}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800"
                style={{ 
                  backgroundColor: selectedCine === cine ? "var(--cineplus-gray-dark)" : "transparent",
                  border: `1px solid ${selectedCine === cine ? "var(--cineplus-gray)" : "var(--cineplus-gray-dark)"}` 
                }}
              >
                <div>
                  <h4 className="font-medium" style={{ color: "var(--cineplus-gray-light)" }}>{cine}</h4>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>2D</p>
                </div>
                <div className="w-4 h-4 rounded-full border-2" style={{ 
                  borderColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "var(--cineplus-gray)",
                  backgroundColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "transparent"
                }} />
              </div>
            ))}
          </div>

          <button 
            onClick={() => {}}
            className="w-full mt-6 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            APLICAR
          </button>
        </SideModal>
        
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Poster y detalles */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img 
                src={pelicula.imagenCard} 
                alt={pelicula.titulo}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-700 rounded text-sm">{pelicula.genero}</span>
                <span className="px-2 py-1 bg-red-600 rounded text-sm">{pelicula.clasificacion}</span>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">FORMATOS DISPONIBLES</h3>
                <span className="px-3 py-1 bg-gray-700 rounded">2D</span>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">DURACIÓN</h3>
                <p style={{ color: "var(--cineplus-gray)" }}>{pelicula.duracion}</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">FECHA DE ESTRENO</h3>
                <p style={{ color: "var(--cineplus-gray)" }}>18 Octubre, 2025</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">DISTRIBUIDOR</h3>
                <p style={{ color: "var(--cineplus-gray)" }}>UNITED INTERNATIONAL PICTURES</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">ACTORES Y DIRECTOR</h3>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna derecha - Título, sinopsis y horarios */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-4">{pelicula.titulo.toUpperCase()}</h1>
              <div className="relative mb-6">
                <img 
                  src={pelicula.imagenCard} 
                  alt={pelicula.titulo}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all">
                  <FiPlay size={48} className="text-white" />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--cineplus-gray)" }}>
                {pelicula.sinopsis}
              </p>
            </div>
            
            {/* Sección de horarios */}
            <div>
              <h2 className="text-2xl font-bold mb-4">HORARIOS</h2>
              
              {/* Selección de días */}
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  {availableDates.map((day) => (
                    <button 
                      key={day.fullDate}
                      onClick={() => setSelectedDay(day.fullDate)}
                      className={`px-4 py-2 rounded font-bold transition-colors ${
                        selectedDay === day.fullDate 
                          ? "bg-white text-black" 
                          : "border border-gray-600 text-gray-400 hover:text-white"
                      }`}
                    >
                      <div className="text-center">
                        <div>{day.label}</div>
                        <div className="text-xs">{day.date}</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Selección de formatos */}
                <div className="flex gap-4 mb-4">
                  <div className="flex gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--cineplus-gray)" }}>Formatos:</span>
                    {availableFormats.map((format) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedFormat === format
                            ? "bg-gray-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "var(--cineplus-gray)" }}>Idioma: Español</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">DISPONIBILIDAD DE ASIENTOS</h3>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Alta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Media</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Baja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span>Lleno</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">CINE PRINCIPAL</h3>
                <h4 className="text-red-500 font-bold mb-2">HORARIOS EN {selectedCine?.toUpperCase()}</h4>
                <p className="text-sm mb-4" style={{ color: "var(--cineplus-gray)" }}>
                  Dirección: Calle Alfredo Mendiola 3698 Km 8.5 de la Av. Panamericana Norte Independencia
                </p>
                
                <div className="mb-4">
                  <span className="font-bold">{selectedFormat || "2D"}</span>
                  <span className="ml-2" style={{ color: "var(--cineplus-gray)" }}>- Doblada</span>
                </div>
                
                {/* Selección de horarios */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {availableTimes.length > 0 ? availableTimes.map((time) => (
                    <button 
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-4 py-2 rounded transition-colors ${
                        selectedTime === time
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {time}
                    </button>
                  )) : (
                    <p className="text-gray-400 text-sm">Selecciona día y formato para ver horarios</p>
                  )}
                </div>
                
                <p className="text-sm mb-4" style={{ color: "var(--cineplus-gray)" }}>
                  Selecciona hasta 3 cines para comparar sesiones y horarios
                </p>
                
                <button className="w-full py-3 border border-gray-600 rounded mb-4 hover:bg-gray-800 transition-colors">
                  Ver horarios en más cines
                </button>
                
                <button 
                  className={`w-full py-3 rounded font-bold transition-colors ${
                    isReadyToBuy
                      ? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!isReadyToBuy}
                  onClick={() => {
                    if (isReadyToBuy) {
                      localStorage.setItem('movieSelection', JSON.stringify({
                        pelicula: pelicula,
                        selectedDay,
                        selectedTime,
                        selectedFormat,
                        selectedCine
                      }));
                      window.location.href = `/boletos?pelicula=${pelicula.id}&day=${selectedDay}&time=${selectedTime}&format=${selectedFormat}`;
                    }
                  }}
                >
                  COMPRAR ENTRADAS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DetallePelicula;
