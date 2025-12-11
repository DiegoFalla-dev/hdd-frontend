import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// Usamos el modal de selección de cines que provee el Navbar mediante evento
import { useAllMovies } from "../hooks/useMovies";
import { useShowtimes } from "../hooks/useShowtimes";
import { useAvailableDates } from "../hooks/useAvailableDates";
import type { Movie } from '../types/Movie';
import authService from '../services/authService';
import { useShowtimeSelectionStore } from '../store/showtimeSelectionStore';
import { getAllCinemas, getCinemaById } from "../services/cinemaService"; // Importar getCinemaById
import type { Cinema } from "../types/Cinema";
import { FiPlay } from "react-icons/fi";

const DetallePelicula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCineName, setSelectedCineName] = useState<string | null>(null); // Cambiado a selectedCineName
  const [selectedCinemaData, setSelectedCinemaData] = useState<Cinema | null>(null); // Nuevo estado para los datos del cine
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [pelicula, setPelicula] = useState<Movie | null>(null);
  const { data: allMovies = [] } = useAllMovies();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  
  const peliculaId = searchParams.get('pelicula');
  const navigate = useNavigate();
  
  // Obtener fechas disponibles dinámicamente desde el backend
  const availableDatesQuery = useAvailableDates({ movieId: pelicula?.id, cinemaId: selectedCinemaData?.id });
  const availableDates = availableDatesQuery.data || [];
  
  // Helper: muestra las etiquetas de formato limpias al usuario (backend usa valores como "_2D")
  const formatLabel = (f?: string | null) => {
    if (!f) return '';
    return f.replace(/^_+/, '').toUpperCase();
  };
  const showtimesQuery = useShowtimes({ 
    movieId: pelicula?.id, 
    cinemaId: selectedCinemaData?.id, 
    date: selectedDay || undefined // Pasar undefined en lugar de string vacío
  });
  const backendShowtimes = showtimesQuery.data || [];
  
  // Debug: ver qué datos tenemos
  console.log('📊 Estado actual:', {
    peliculaId: pelicula?.id,
    cinemaId: selectedCinemaData?.id,
    selectedDay,
    showtimesCount: backendShowtimes.length,
    showtimes: backendShowtimes
  });
  
  // Helper: normaliza formatos para que siempre tengan el formato del backend (_2D, _3D)
  const normalizeFormat = (f: string) => {
    if (!f) return f;
    // Si ya tiene guión bajo, devolverlo tal cual
    if (f.startsWith('_')) return f;
    // Si no, agregarlo
    return '_' + f;
  };
  
  // Obtener formatos disponibles SOLO para la fecha seleccionada
  const availableFormats = useMemo(() => {
    if (!selectedDay) return [];
    const formats = new Set<string>();
    console.log('🔍 Calculando availableFormats para fecha:', selectedDay);
    backendShowtimes.forEach(s => { 
      if (s.format && s.startTime) {
        const showDate = new Date(s.startTime).toISOString().split('T')[0];
        if (showDate === selectedDay) {
          console.log('  ✅ Agregando formato:', s.format, '(tipo:', typeof s.format, ')');
          formats.add(s.format);
        }
      }
    });
    const result = Array.from(formats);
    console.log('📋 availableFormats final:', result);
    return result;
  }, [backendShowtimes, selectedDay]);
  
  // Si no hay formatos disponibles para la fecha seleccionada, mostrar los de la película como fallback
  const formatsToShow = useMemo(() => {
    if (availableFormats && availableFormats.length > 0) return availableFormats;
    // Si hay fecha seleccionada pero no formatos específicos, usar los formatos de la película/cine (normalizados)
    if (selectedDay) {
      if (selectedCinemaData?.availableFormats && selectedCinemaData.availableFormats.length > 0) {
        return selectedCinemaData.availableFormats.map(normalizeFormat);
      }
      return pelicula?.formats && pelicula.formats.length ? pelicula.formats.map(normalizeFormat) : [];
    }
    // Si no hay fecha seleccionada, mostrar formatos generales (normalizados)
    if (selectedCinemaData?.availableFormats && selectedCinemaData.availableFormats.length > 0) {
      return selectedCinemaData.availableFormats.map(normalizeFormat);
    }
    return pelicula?.formats && pelicula.formats.length ? pelicula.formats.map(normalizeFormat) : [];
  }, [availableFormats, selectedDay, selectedCinemaData?.availableFormats, pelicula?.formats]);

  // Si cambia el día, limpiamos el formato y la hora seleccionada
  useEffect(() => {
    setSelectedFormat(null);
    setSelectedTime(null);
  }, [selectedDay]);
  
  // Si cambia el formato, limpiamos la hora seleccionada
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedFormat]);
  const availableTimes = useMemo(() => {
    if (!selectedDay || !selectedFormat) return [];
    
    // Debug: mostrar todos los showtimes para la fecha seleccionada
    console.log('🔍 Debug showtimes para fecha:', selectedDay);
    console.log('🔍 Formato seleccionado:', selectedFormat);
    backendShowtimes.forEach((s, idx) => {
      const showDate = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : 'sin fecha';
      console.log(`  Showtime ${idx}: fecha=${showDate}, format="${s.format}" (tipo: ${typeof s.format})`);
    });
    
    const filteredShowtimes = backendShowtimes.filter(s => {
      if (!s.startTime) return false;
      const showDate = new Date(s.startTime).toISOString().split('T')[0];
      const dateMatch = showDate === selectedDay;
      const formatMatch = s.format === selectedFormat;
      
      console.log(`    Comparando: fecha ${showDate} === ${selectedDay}? ${dateMatch}, formato "${s.format}" === "${selectedFormat}"? ${formatMatch}`);
      
      return dateMatch && formatMatch;
    });
    
    console.log('✅ Showtimes filtrados:', filteredShowtimes.length);
    filteredShowtimes.forEach((s, i) => {
      const timeStr = new Date(s.startTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      console.log(`  [${i}] id=${s.id}, teatro=${s.theaterId}, hora=${timeStr}`);
    });
    
    // Usar un Map para eliminar duplicados por hora, manteniendo el primer showtime de cada hora
    const timeMap = new Map<string, typeof filteredShowtimes[0]>();
    filteredShowtimes.forEach(s => {
      const timeStr = new Date(s.startTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      if (!timeMap.has(timeStr)) {
        timeMap.set(timeStr, s);
      }
    });
    
    console.log('🕐 Horarios únicos en Map:', timeMap.size);
    
    // Convertir a array de [hora, showtime] y ordenar por hora
    return Array.from(timeMap.entries())
      .sort((a, b) => {
        // sort times by HH:MM
        const toMinutes = (t: string) => {
          const parts = t.split(':').map(p => parseInt(p, 10));
          return parts[0] * 60 + (parts[1] || 0);
        };
        return toMinutes(a[0]) - toMinutes(b[0]);
      })
      .map(([time]) => time); // Solo devolver las horas únicas ordenadas
  }, [selectedDay, selectedFormat, backendShowtimes]);

  const isReadyToBuy = selectedDay && selectedTime && selectedFormat;

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchData = async () => {
      try {
        if (peliculaId) {
          const foundMovie = allMovies.find(p => String(p.id) === peliculaId) || null;
          setPelicula(foundMovie);
        }
        const cinemasData = await getAllCinemas();
        setCinemas(cinemasData);
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
          window.dispatchEvent(new CustomEvent('openCinemaModal', { detail: { from: 'detalle' } }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [peliculaId, allMovies]);

  // Listen for login events to reload preferred cinema selection
  useEffect(() => {
    const onLogin = () => {
      const savedCine = localStorage.getItem('selectedCine');
      if (savedCine) {
        try {
          const parsed = JSON.parse(savedCine) as Cinema;
          setSelectedCineName(parsed.name);
        } catch (err) {
          console.error('Error parsing selectedCine after login', err);
        }
      }
    };
    window.addEventListener('auth:login', onLogin);
    return () => window.removeEventListener('auth:login', onLogin);
  }, [cinemas]);

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
      <div className="min-h-screen pt-16 text-white" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
        <Navbar />
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="w-full h-96 rounded-xl animate-pulse bg-gradient-to-br from-neutral-800 to-neutral-900 mb-6"></div>
              <div className="space-y-4">
                <div className="w-32 h-4 rounded animate-pulse bg-neutral-800"></div>
                <div className="w-24 h-4 rounded animate-pulse bg-neutral-800"></div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="w-3/4 h-10 rounded mb-4 animate-pulse bg-neutral-800"></div>
              <div className="w-full h-96 rounded-xl mb-6 animate-pulse bg-gradient-to-br from-neutral-800 to-neutral-900"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen pt-16 text-white" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
        <Navbar />
        <div className="p-8 text-center">
          <div className="card-glass p-12 rounded-xl max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Película no encontrada</h2>
            <p className="text-neutral-400">La película que buscas no existe o ha sido eliminada</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 text-white" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto p-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="mb-6 img-hover-zoom overflow-hidden rounded-xl">
              <img 
                src={pelicula.posterUrl || '/placeholder.jpg'} 
                alt={pelicula.title}
                className="w-full rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <div className="space-y-4 card-glass p-6 rounded-xl animate-slide-up">
              <div className="flex items-center gap-2 flex-wrap">
                {pelicula.genre && (
                  <span className="badge-gradient-red">
                    {pelicula.genre}
                  </span>
                )}
                {pelicula.status && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#BB2228] to-[#8B191E] shadow-lg">
                    {pelicula.status === 'NOW_PLAYING' ? 'EN CARTELERA' : pelicula.status === 'UPCOMING' ? 'PRÓXIMAMENTE' : pelicula.status}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                  FORMATOS DISPONIBLES
                </h3>
                {formatsToShow.length === 0 ? (
                  <span className="px-3 py-1.5 rounded-lg bg-neutral-800/50 text-neutral-400 text-sm">N/D</span>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {formatsToShow.map(f => (
                      <span key={f} className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 text-white text-sm font-semibold shadow-md">{formatLabel(f)}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-bold mb-2">DURACIÓN</h3>
                <p style={{ color: "#E3E1E2" }}>
                  {pelicula.duration || 'No disponible'}
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">FECHA DE ESTRENO</h3>
                <p style={{ color: "#E3E1E2" }}>
                  {pelicula.releaseDate
                    ? new Date(pelicula.releaseDate).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Sin fecha'}
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">IDIOMAS</h3>
                <p style={{ color: "#E3E1E2" }}>
                  {pelicula.languages && pelicula.languages.length > 0
                    ? pelicula.languages.join(', ')
                    : 'Español'}
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">REPARTO</h3>
                <p style={{ color: "#E3E1E2" }}>
                  {pelicula.cast && pelicula.cast.length > 0
                    ? pelicula.cast.join(', ')
                    : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="mb-6 animate-slide-up">
              <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                {pelicula.title.toUpperCase()}
              </h1>
              <div className="relative mb-6 rounded-xl overflow-hidden shadow-2xl">
                {showTrailer && pelicula.trailerUrl ? (
                  <div className="relative w-full h-96">
                    <iframe
                      className="w-full h-full"
                      src={pelicula.trailerUrl.includes('youtube.com') || pelicula.trailerUrl.includes('youtu.be')
                        ? pelicula.trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                        : pelicula.trailerUrl}
                      title={pelicula.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    <button
                      onClick={() => setShowTrailer(false)}
                      className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black transition-all text-sm font-semibold shadow-lg"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <img 
                      src={pelicula.posterUrl || '/placeholder.jpg'} 
                      alt={pelicula.title}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    {pelicula.trailerUrl && (
                      <button 
                        onClick={() => setShowTrailer(true)}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all duration-300"
                      >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                          <FiPlay size={36} className="text-white ml-1" />
                        </div>
                        <span className="mt-4 text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">Ver Tráiler</span>
                      </button>
                    )}
                    {!pelicula.trailerUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center">
                          <FiPlay size={36} className="text-gray-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="card-glass p-6 rounded-xl">
                <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                  SINOPSIS
                </h3>
                <p className="text-base leading-relaxed text-neutral-300">
                  {pelicula.synopsis}
                </p>
              </div>
            </div>
            
            <div className="card-glass p-6 rounded-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                HORARIOS
              </h2>
              
              {pelicula.status === 'UPCOMING' ? (
                <div className="mb-6 p-8 rounded-xl text-center card-glass">
                  <svg className="w-16 h-16 mx-auto mb-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg text-neutral-300">
                    No hay funciones programadas para esta película
                  </p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Vuelve pronto para ver los horarios disponibles
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-sm text-neutral-400">SELECCIONA UN DÍA</h3>
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                      {availableDates.map((day) => (
                        <button 
                          key={day.fullDate}
                          onClick={() => setSelectedDay(day.fullDate)}
                          className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 flex-shrink-0 ${
                            selectedDay === day.fullDate 
                              ? 'btn-primary-gradient shadow-lg transform scale-105' 
                              : 'bg-neutral-800/50 border border-neutral-700 hover:border-[#BB2228] hover:bg-neutral-800'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-sm">{day.label}</div>
                            <div className="text-xs opacity-80">{day.date}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex gap-2">
                    <span className="text-sm font-medium" style={{ color: "#E3E1E2" }}>Formatos:</span>
                      {formatsToShow.map((format) => (
                      <button
                        key={format}
                        onClick={() => {
                          console.log('🎬 Botón formato clickeado:', format, '(tipo:', typeof format, ')');
                          setSelectedFormat(format);
                        }}
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{
                          backgroundColor: selectedFormat === format ? "#393A3A" : "#141113",
                          color: selectedFormat === format ? "#EFEFEE" : "#E3E1E2"
                        }}
                      >
                        {formatLabel(format)}
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
                  <span className="font-bold">{formatLabel(selectedFormat) || "2D"}</span>
                  <span className="ml-2" style={{ color: "#E3E1E2" }}>- Doblada</span>
                </div>
                
                <div className="flex gap-2 mb-6 flex-wrap">
                  {availableTimes.length > 0 ? availableTimes.map((time) => (
                    <button 
                      key={time}
                      onClick={() => {
                        const user = authService.getCurrentUser();
                        if (!user) {
                          // Open the profile/login modal provided by Navbar
                          window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { from: 'horario-click' } }));
                          return;
                        }
                        setSelectedTime(time);
                      }}
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: selectedTime === time ? "#BB2228" : "#393A3A",
                        color: selectedTime === time ? "#EFEFEE" : "#E3E1E2"
                      }}
                    >
                      {time}
                    </button>
                  )) : (
                    <div>
                      <p className="text-sm" style={{ color: "#E3E1E2" }}>Selecciona día y formato para ver horarios</p>
                      {selectedDay && selectedFormat && (
                        (() => {
                          const matchDateCount = backendShowtimes.filter(s => s.startTime && new Date(s.startTime).toISOString().split('T')[0] === selectedDay).length;
                          const matchFormatCount = backendShowtimes.filter(s => s.format === selectedFormat).length;
                          return (
                            <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-yellow-200">
                              <div>No hay funciones encontradas para la combinación seleccionada.</div>
                              <div>showtimes recibidos: {backendShowtimes.length}</div>
                              <div>coincidencias por fecha ({selectedDay}): {matchDateCount}</div>
                              <div>coincidencias por formato ({selectedFormat}): {matchFormatCount}</div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-sm mb-4" style={{ color: "#E3E1E2" }}>
                  Selecciona hasta 3 cines para comparar sesiones y horarios
                </p>
                
                <button className="w-full py-3 rounded mb-4 transition-colors" style={{ border: "1px solid #393A3A", color: "#EFEFEE", backgroundColor: "transparent" }}>
                  Ver horarios en más cines
                </button>
                
                <button 
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                    isReadyToBuy && selectedCinemaData 
                      ? 'btn-primary-gradient btn-shine hover:scale-105' 
                      : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
                  }`}
                  disabled={!isReadyToBuy || !selectedCinemaData}
                  onClick={() => {
                    if (!(isReadyToBuy && selectedCinemaData)) return;
                    // validar sesión
                    const user = authService.getCurrentUser();
                    if (!user) {
                      // abrir modal de perfil del Navbar (no una copia)
                      window.dispatchEvent(new CustomEvent('openProfileModal'));
                      return;
                    }
                    // Encontrar showtime real que coincida con selección
                    const matchedShowtime = backendShowtimes.find(st => {
                      const showTimeLocal = new Date(st.startTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                      const showDate = new Date(st.startTime).toISOString().split('T')[0];
                      return showTimeLocal === selectedTime && st.format === selectedFormat && showDate === selectedDay;
                    });
                    if (!matchedShowtime) {
                      alert('No se encontró la función seleccionada. Intenta nuevamente.');
                      return;
                    }
                    const selectionStore = useShowtimeSelectionStore.getState();
                    selectionStore.setSelection({
                      showtimeId: matchedShowtime.id,
                      movieId: pelicula.id,
                      movieTitle: pelicula.title,
                      cinemaId: selectedCinemaData.id,
                      cinemaName: selectedCinemaData.name,
                      theaterName: matchedShowtime.theaterName || 'Sala', // placeholder si no existe
                      date: selectedDay!,
                      time: selectedTime!,
                      format: selectedFormat!,
                      price: matchedShowtime.price
                    });
                    // Navegar a la página de selección de entradas (CarritoEntradas)
                    navigate('/carrito-entradas');
                  }}
                >
                  COMPRAR ENTRADAS
                </button>
              </div>
              </>
              )}
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