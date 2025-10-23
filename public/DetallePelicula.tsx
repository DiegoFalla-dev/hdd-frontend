import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SideModal from "../components/SideModal";
import { getMovies, type Pelicula } from "../services/moviesService";
import { getAllCinemas } from "../services/cinemaService";
import type { Cinema } from "../types/Cinema";
import { cinemaStorage } from "../utils/cinemaStorage";
import { FiPlay } from "react-icons/fi";

const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  today.setHours(today.getHours() - 5); // GMT-5 Peru timezone
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
    const dayNumber = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    dates.push({
      label: dayName,
      date: `${dayNumber}/${month}`,
      fullDate: date.toISOString().split('T')[0]
    });
  }
  
  return dates;
};

const DetallePelicula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [showCineModal, setShowCineModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const availableFormats = ["2D", "3D", "IMAX"];
  const [loading, setLoading] = useState(true);
  
  const peliculaId = searchParams.get('pelicula');
  
  const availableDates = getAvailableDates();
  const availableTimes = selectedDay && selectedFormat ? 
    ["14:30", "17:00", "19:30", "22:00"] : [];

  const isReadyToBuy = selectedDay && selectedTime && selectedFormat;

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchData = async () => {
      try {
        const [moviesData, cinemasData] = await Promise.all([
          getMovies(),
          getAllCinemas()
        ]);
        
        const foundMovie = moviesData.find(p => p.id === peliculaId);
        setPelicula(foundMovie || null);
        setCinemas(cinemasData);
        

        
        const savedCine = cinemaStorage.load();
        if (savedCine) {
          setSelectedCine(savedCine.name);
        } else {
          setShowCineModal(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (peliculaId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [peliculaId]);

  const handleCineSelection = (cineId: string) => {
    const selectedCinema = cinemas.find(c => c.id.toString() === cineId);
    if (selectedCinema) {
      setSelectedCine(selectedCinema.name);
      cinemaStorage.save(selectedCinema);
      setShowCineModal(false);
      // Recargar para sincronizar con Navbar
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#141113", color: "#EFEFEE" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="w-full h-96 rounded-lg animate-pulse mb-6" style={{ backgroundColor: "#393A3A" }}></div>
              <div className="space-y-4">
                <div className="w-32 h-4 rounded animate-pulse" style={{ backgroundColor: "#393A3A" }}></div>
                <div className="w-24 h-4 rounded animate-pulse" style={{ backgroundColor: "#393A3A" }}></div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="w-3/4 h-10 rounded mb-4 animate-pulse" style={{ backgroundColor: "#393A3A" }}></div>
              <div className="w-full h-64 rounded-lg mb-6 animate-pulse" style={{ backgroundColor: "#393A3A" }}></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div style={{ background: "#141113", color: "#EFEFEE" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Película no encontrada</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "#141113", color: "#EFEFEE" }} className="min-h-screen pt-16">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img 
                src={pelicula.imagenCard || '/placeholder.jpg'} 
                alt={pelicula.titulo}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: "#393A3A", color: "#EFEFEE" }}>{pelicula.genero}</span>
                <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: "#BB2228", color: "#EFEFEE" }}>{pelicula.clasificacion}</span>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">FORMATOS DISPONIBLES</h3>
                <span className="px-3 py-1 rounded" style={{ backgroundColor: "#393A3A", color: "#EFEFEE" }}>2D</span>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">DURACIÓN</h3>
                <p style={{ color: "#E3E1E2" }}>{pelicula.duracion}</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">FECHA DE ESTRENO</h3>
                <p style={{ color: "#E3E1E2" }}>18 Octubre, 2025</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">DISTRIBUIDOR</h3>
                <p style={{ color: "#E3E1E2" }}>UNITED INTERNATIONAL PICTURES</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-4">{pelicula.titulo.toUpperCase()}</h1>
              <div className="relative mb-6">
                <img 
                  src={pelicula.banner || pelicula.imagenCard || '/placeholder.jpg'} 
                  alt={pelicula.titulo}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all">
                  <FiPlay size={48} className="text-white" />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#E3E1E2" }}>
                {pelicula.sinopsis}
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">HORARIOS</h2>
              
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  {availableDates.map((day) => (
                    <button 
                      key={day.fullDate}
                      onClick={() => setSelectedDay(day.fullDate)}
                      className="px-4 py-2 rounded font-bold transition-colors"
                      style={{
                        backgroundColor: selectedDay === day.fullDate ? "#EFEFEE" : "transparent",
                        color: selectedDay === day.fullDate ? "#141113" : "#E3E1E2",
                        border: selectedDay === day.fullDate ? "none" : "1px solid #393A3A"
                      }}
                    >
                      <div className="text-center">
                        <div>{day.label}</div>
                        <div className="text-xs">{day.date}</div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex gap-2">
                    <span className="text-sm font-medium" style={{ color: "#E3E1E2" }}>Formatos:</span>
                    {availableFormats.map((format) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: selectedFormat === format ? "#393A3A" : "#141113",
                          color: selectedFormat === format ? "#EFEFEE" : "#E3E1E2"
                        }}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "#E3E1E2" }}>Idioma: Español</span>
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
                <h4 className="font-bold mb-2" style={{ color: "#BB2228" }}>HORARIOS EN {selectedCine?.toUpperCase()}</h4>
                <p className="text-sm mb-4" style={{ color: "#E3E1E2" }}>
                  Dirección: Calle Alfredo Mendiola 3698 Km 8.5 de la Av. Panamericana Norte Independencia
                </p>
                
                <div className="mb-4">
                  <span className="font-bold">{selectedFormat || "2D"}</span>
                  <span className="ml-2" style={{ color: "#E3E1E2" }}>- Doblada</span>
                </div>
                
                <div className="flex gap-2 mb-6 flex-wrap">
                  {availableTimes.length > 0 ? availableTimes.map((time) => (
                    <button 
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: selectedTime === time ? "#BB2228" : "#393A3A",
                        color: selectedTime === time ? "#EFEFEE" : "#E3E1E2"
                      }}
                    >
                      {time}
                    </button>
                  )) : (
                    <p className="text-sm" style={{ color: "#E3E1E2" }}>Selecciona día y formato para ver horarios</p>
                  )}
                </div>
                
                <p className="text-sm mb-4" style={{ color: "#E3E1E2" }}>
                  Selecciona hasta 3 cines para comparar sesiones y horarios
                </p>
                
                <button className="w-full py-3 rounded mb-4 transition-colors" style={{ border: "1px solid #393A3A", color: "#EFEFEE", backgroundColor: "transparent" }}>
                  Ver horarios en más cines
                </button>
                
                <button 
                  className="w-full py-3 rounded font-bold transition-colors"
                  style={{
                    backgroundColor: isReadyToBuy ? "#BB2228" : "#393A3A",
                    color: isReadyToBuy ? "#EFEFEE" : "#E3E1E2",
                    cursor: isReadyToBuy ? "pointer" : "not-allowed"
                  }}
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
      
      <SideModal 
        isOpen={showCineModal}
        onClose={() => setShowCineModal(false)}
        title="Seleccionar Cine"
        subtitle="Selecciona tu cine favorito"
        orderText="Ordenado alfabéticamente"
      >
        <div className="cinema-list">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className={`cinema-item ${selectedCine === cinema.name ? 'selected' : ''}`}
              onClick={() => handleCineSelection(cinema.id.toString())}
            >
              <span className="cinema-name">{cinema.name}</span>
            </div>
          ))}
        </div>
        <div className="cinema-apply-container">
          <button className="cinema-apply-btn" onClick={() => setShowCineModal(false)}>
            APLICAR
          </button>
        </div>
      </SideModal>
      
      <Footer />
    </div>
  );
};

export default DetallePelicula;