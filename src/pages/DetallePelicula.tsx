import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// Usamos el modal de selección de cines que provee el Navbar mediante evento
import { getMovies, type Pelicula } from "../services/moviesService";
import authService from '../services/authService';
import { getAllCinemas, getCinemaById } from "../services/cinemaService"; // Importar getCinemaById
import { getShowtimes, findMatchingShowtime, formatToFrontend } from "../services/showtimesApi";
import type { Cinema } from "../types/Cinema";
import { FiPlay } from "react-icons/fi";

const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
    const dayNumber = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Generar fullDate en formato YYYY-MM-DD sin conversión de zona horaria
    const fullDate = `${year}-${month}-${dayNumber}`;
    
    dates.push({
      label: dayName,
      date: `${dayNumber}/${month}`,
      fullDate: fullDate
    });
  }
  
  return dates;
};

const DetallePelicula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCineName, setSelectedCineName] = useState<string | null>(null); // Cambiado a selectedCineName
  const [selectedCinemaData, setSelectedCinemaData] = useState<Cinema | null>(null); // Nuevo estado para los datos del cine
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [showtimes, setShowtimes] = useState<any[]>([]); // Estado para guardar funciones disponibles
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [allShowtimesForFormats, setAllShowtimesForFormats] = useState<any[]>([]); // Funciones para extraer formatos disponibles
  const [loadingFormats, setLoadingFormats] = useState(false); // Estado de carga de formatos
  const [loading, setLoading] = useState(true);
  
  const peliculaId = searchParams.get('pelicula');
  
  const availableDates = getAvailableDates();
  
  // Extraer formatos disponibles dinámicamente desde las funciones reales del backend
  const availableFormats = allShowtimesForFormats.length > 0
    ? [...new Set(allShowtimesForFormats.map(st => formatToFrontend(st.format)))]
    : [];
  
  // Extraer horarios únicos desde showtimes reales
  const availableTimes = selectedDay && selectedFormat && showtimes.length > 0
    ? [...new Set(showtimes.map(st => st.time.substring(0, 5)))].sort()
    : [];

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
        
        // Leer el cine seleccionado desde localStorage (guardado por el Navbar como 'selectedCine')
        const savedCine = localStorage.getItem('selectedCine');
        if (savedCine) {
          try {
            const parsed = JSON.parse(savedCine) as Cinema;
            setSelectedCineName(parsed.name);
            setSelectedCinemaData(parsed);
          } catch (err) {
            console.error('Error parsing selectedCine from localStorage', err);
          }
        } else {
          // Abrir el modal del Navbar (no una copia) indicando que viene de DetallePelicula
          window.dispatchEvent(new CustomEvent('openCinemaModal', { detail: { from: 'detalle' } }));
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

  // Cargar showtimes SIN filtro de formato para extraer los formatos disponibles
  useEffect(() => {
    const loadAvailableFormats = async () => {
      if (!selectedDay || !selectedCinemaData || !pelicula) {
        setAllShowtimesForFormats([]);
        return;
      }

      setLoadingFormats(true);
      try {
        const showtimesData = await getShowtimes(
          Number(pelicula.id),
          selectedCinemaData.id,
          selectedDay
        );
        setAllShowtimesForFormats(showtimesData);
        
        // Si el formato seleccionado ya no está disponible, resetear
        if (selectedFormat) {
          const availableFormatsFromData = [...new Set(showtimesData.map(st => formatToFrontend(st.format)))];
          if (!availableFormatsFromData.includes(selectedFormat)) {
            setSelectedFormat(null);
            setSelectedTime(null);
          }
        }
      } catch (error) {
        console.error('Error loading available formats:', error);
        setAllShowtimesForFormats([]);
      } finally {
        setLoadingFormats(false);
      }
    };

    loadAvailableFormats();
  }, [selectedDay, selectedCinemaData, pelicula]);

  // Cargar showtimes cuando cambien día, formato o cine
  useEffect(() => {
    const loadShowtimes = async () => {
      if (!selectedDay || !selectedFormat || !selectedCinemaData || !pelicula) {
        setShowtimes([]);
        return;
      }

      setLoadingShowtimes(true);
      try {
        const showtimesData = await getShowtimes(
          Number(pelicula.id),
          selectedCinemaData.id,
          selectedDay
        );
        setShowtimes(showtimesData);
      } catch (error) {
        console.error('Error loading showtimes:', error);
        setShowtimes([]);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    loadShowtimes();
  }, [selectedDay, selectedFormat, selectedCinemaData, pelicula]);

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
                    {loadingFormats ? (
                      <span className="text-sm" style={{ color: "#E3E1E2" }}>Cargando formatos...</span>
                    ) : availableFormats.length > 0 ? availableFormats.map((format) => (
                      <button
                        key={format}
                        onClick={() => {
                          setSelectedFormat(format);
                          setSelectedTime(null); // Reset time cuando cambia formato
                        }}
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: selectedFormat === format ? "#393A3A" : "#141113",
                          color: selectedFormat === format ? "#EFEFEE" : "#E3E1E2"
                        }}
                      >
                        {format}
                      </button>
                    )) : (
                      <span className="text-sm" style={{ color: selectedDay ? "#FFC107" : "#E3E1E2" }}>
                        {selectedDay ? "⚠️ No hay funciones disponibles para esta fecha en este cine" : "Selecciona un día primero"}
                      </span>
                    )}
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
                  {loadingShowtimes ? (
                    <p className="text-sm" style={{ color: "#E3E1E2" }}>Cargando horarios...</p>
                  ) : availableTimes.length > 0 ? availableTimes.map((time) => {
                    // Buscar el showtime correspondiente para mostrar disponibilidad
                    const showtime = findMatchingShowtime(showtimes, time, selectedFormat!);
                    const available = showtime?.availableSeats ?? 0;
                    const total = showtime?.totalSeats ?? 0;
                    const percentAvailable = total > 0 ? (available / total) * 100 : 0;
                    
                    return (
                      <button 
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        disabled={available === 0}
                        className="px-4 py-2 rounded transition-colors relative"
                        style={{
                          backgroundColor: selectedTime === time ? "#BB2228" : (available === 0 ? "#2A2A2A" : "#393A3A"),
                          color: selectedTime === time ? "#EFEFEE" : (available === 0 ? "#666" : "#E3E1E2"),
                          cursor: available === 0 ? "not-allowed" : "pointer",
                          opacity: available === 0 ? 0.5 : 1
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{time}</span>
                          {showtime && (
                            <span className="text-xs mt-1" style={{ 
                              color: percentAvailable > 50 ? "#4CAF50" : percentAvailable > 20 ? "#FFC107" : "#FF5722"
                            }}>
                              {available > 0 ? `${available} disponibles` : 'Agotado'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }) : (
                    <p className="text-sm" style={{ color: "#E3E1E2" }}>Selecciona día y formato para ver horarios</p>
                  )}
                </div>
                
                {availableTimes.length === 0 && selectedDay && selectedFormat && !loadingShowtimes && (
                  <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#393A3A", color: "#FFC107" }}>
                    <p className="text-sm">
                      ⚠️ No hay funciones disponibles para esta combinación de día y formato.
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#E3E1E2" }}>
                      Intenta seleccionar otra fecha u otro formato.
                    </p>
                  </div>
                )}
                
                <button 
                  className="w-full py-3 rounded font-bold transition-colors"
                  style={{
                    backgroundColor: isReadyToBuy && selectedCinemaData ? "#BB2228" : "#393A3A",
                    color: isReadyToBuy && selectedCinemaData ? "#EFEFEE" : "#E3E1E2",
                    cursor: isReadyToBuy && selectedCinemaData ? "pointer" : "not-allowed"
                  }}
                  disabled={!isReadyToBuy || !selectedCinemaData}
                  onClick={async () => {
                    if (!(isReadyToBuy && selectedCinemaData)) return;
                    
                    // validar sesión
                    const user = authService.getCurrentUser();
                    if (!user) {
                      // abrir modal de perfil del Navbar (no una copia)
                      window.dispatchEvent(new CustomEvent('openProfileModal'));
                      return;
                    }

                    // Obtener el showtimeId real desde el backend
                    try {
                      // Llamar al API de showtimes
                      const showtimes = await getShowtimes(
                        Number(pelicula.id),
                        selectedCinemaData.id,
                        selectedDay
                      );

                      // Buscar la función que coincida con el horario y formato seleccionados
                      const selectedShowtime = findMatchingShowtime(
                        showtimes,
                        selectedTime!,
                        selectedFormat!
                      );

                      if (!selectedShowtime) {
                        alert('La función seleccionada no está disponible. Por favor, elige otro horario o formato.');
                        return;
                      }

                      // Guardar selección con showtimeId REAL del backend
                      localStorage.setItem('movieSelection', JSON.stringify({
                        pelicula: pelicula,
                        selectedDay,
                        selectedTime,
                        selectedFormat,
                        selectedCineId: selectedCinemaData.id,
                        showtimeId: selectedShowtime.id // ✅ ID REAL del backend (número)
                      }));

                      // Navegar a confirmación
                      window.location.href = `/confirmacion?pelicula=${pelicula.id}&day=${selectedDay}&time=${selectedTime}&format=${selectedFormat}&cineId=${selectedCinemaData.id}`;
                      
                    } catch (error) {
                      console.error('Error al obtener funciones:', error);
                      alert('No se pudieron cargar las funciones disponibles. Por favor, verifica tu conexión e intenta de nuevo.');
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
      
      {/* El modal de selección de cines lo provee el Navbar; aquí no renderizamos una copia */}
      
      <Footer />
    </div>
  );
};

export default DetallePelicula;