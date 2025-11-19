import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SideModal from "../components/SideModal";
import { getMovies, type Pelicula } from "../services/moviesService";
import { getAllCinemas, getCinemaById } from "../services/cinemaService"; // Importar getCinemaById
import type { Cinema } from "../types/Cinema";
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
  const [selectedCineName, setSelectedCineName] = useState<string | null>(null); // Cambiado a selectedCineName
  const [selectedCinemaData, setSelectedCinemaData] = useState<Cinema | null>(null); // Nuevo estado para los datos del cine
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
        
        const savedCineId = localStorage.getItem("selectedCineId"); // Ahora guardamos el ID
        if (savedCineId) {
          const foundSavedCine = cinemasData.find(c => c.id.toString() === savedCineId);
          if (foundSavedCine) {
            setSelectedCineName(foundSavedCine.name);
            setSelectedCinemaData(foundSavedCine); // Almacena los datos completos
          }
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

  // Nuevo useEffect para cargar los datos del cine cuando selectedCineName o cinemas cambien
  useEffect(() => {
    const loadCinemaData = async () => {
      if (selectedCineName && cinemas.length > 0) {
        const foundCine = cinemas.find(c => c.name === selectedCineName);
        if (foundCine) {
          try {
            // Aquí usamos getCinemaById para obtener los datos más recientes del cine desde el backend
            const cinemaDetails = await getCinemaById(foundCine.id); 
            setSelectedCinemaData(cinemaDetails);
          } catch (error) {
            console.error('Error fetching cinema details:', error);
            setSelectedCinemaData(foundCine); // Fallback a los datos locales si falla la API
          }
        }
      }
    };

    loadCinemaData();
  }, [selectedCineName, cinemas]); // Dependencias: cuando cambie el nombre del cine o la lista de cines

  const handleCineSelection = (cineId: string) => {
    const selectedCinema = cinemas.find(c => c.id.toString() === cineId);
    if (selectedCinema) {
      setSelectedCineName(selectedCinema.name);
      setSelectedCinemaData(selectedCinema); // También guarda los datos completos aquí
      localStorage.setItem("selectedCineId", selectedCinema.id.toString()); // Guarda el ID
      setShowCineModal(false);
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
                <h4 className="font-bold mb-2" style={{ color: "#BB2228" }}>
                  HORARIOS EN {selectedCinemaData?.name ? selectedCinemaData.name.toUpperCase() : "SELECCIONA UN CINE"}
                </h4>
                <p className="text-sm mb-4" style={{ color: "#E3E1E2" }}>
                  Dirección: {selectedCinemaData?.location || "Dirección no disponible"}
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
                    backgroundColor: isReadyToBuy && selectedCinemaData ? "#BB2228" : "#393A3A",
                    color: isReadyToBuy && selectedCinemaData ? "#EFEFEE" : "#E3E1E2",
                    cursor: isReadyToBuy && selectedCinemaData ? "pointer" : "not-allowed"
                  }}
                  disabled={!isReadyToBuy || !selectedCinemaData}
                  onClick={() => {
                    if (isReadyToBuy && selectedCinemaData) {
                      localStorage.setItem('movieSelection', JSON.stringify({
                        pelicula: pelicula,
                        selectedDay,
                        selectedTime,
                        selectedFormat,
                        selectedCineId: selectedCinemaData.id // Guardar el ID del cine
                      }));
                      window.location.href = `/boletos?pelicula=${pelicula.id}&day=${selectedDay}&time=${selectedTime}&format=${selectedFormat}&cineId=${selectedCinemaData.id}`;
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
        title="Elige tu cine"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#E3E1E2" }}>Selecciona tu cine favorito</h3>
          <p className="text-xs mb-4" style={{ color: "#E3E1E2" }}>Ordenado alfabéticamente</p>
        </div>

        <div className="space-y-3">
          {cinemas.map((cine) => (
            <div 
              key={cine.id}
              onClick={() => handleCineSelection(cine.id.toString())}
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
              style={{ 
                backgroundColor: selectedCineName === cine.name ? "#393A3A" : "transparent",
                border: `1px solid ${selectedCineName === cine.name ? "#E3E1E2" : "#393A3A"}` 
              }}
            >
              <div>
                <h4 className="font-medium" style={{ color: "#EFEFEE" }}>{cine.name}</h4>
                <p className="text-xs" style={{ color: "#E3E1E2" }}>{cine.location}</p>
              </div>
              <div className="w-4 h-4 rounded-full border-2" style={{ 
                borderColor: selectedCineName === cine.name ? "#EFEFEE" : "#E3E1E2",
                backgroundColor: selectedCineName === cine.name ? "#EFEFEE" : "transparent"
              }} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShowCineModal(false)}
          className="w-full mt-6 py-3 px-4 font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: "#BB2228", color: "#EFEFEE" }}
        >
          APLICAR
        </button>
      </SideModal>
      
      <Footer />
    </div>
  );
};

export default DetallePelicula;