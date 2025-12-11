import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sliders } from "react-feather";
import axios from "axios";
import { fetchAllMovies } from "../services/moviesService";
import type { Movie as Pelicula } from "../types/Movie";
import { getAllCinemas } from "../services/cinemaService";
import type { Cinema } from "../types/Cinema";

const getDateOptions = () => {
  const dates = [];
  const today = new Date();
  today.setHours(today.getHours() - 5); // GMT-5 Peru timezone
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    dates.push(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dateStr}`);
  }
  
  return dates;
};

const FilterBar: React.FC = () => {
  const [movie, setMovie] = useState("");
  const [city, setCity] = useState("");
  const [cinema, setCinema] = useState("");
  const [date, setDate] = useState("");
  const [movies, setMovies] = useState<Pelicula[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Solo habilitamos el botón cuando todos los campos están completos
  const isReady = movie && city && cinema && date;

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const fetchData = async () => {
      try {
        console.log('[FilterBar] Starting data fetch...');
        
        const [moviesData, cinemasData] = await Promise.all([
          fetchAllMovies(),
          getAllCinemas()
        ]);
        
        if (isCancelled) {
          console.log('[FilterBar] Component unmounted, ignoring data');
          return;
        }
        
        console.log('[FilterBar] Data received - Movies:', moviesData?.length || 0, 'Cinemas:', cinemasData?.length || 0);
        
        // Actualizar siempre, incluso si está vacío (para salir del loading)
        setMovies(moviesData || []);
        setCinemas(cinemasData || []);
        
        if (!moviesData || moviesData.length === 0) {
          console.warn('[FilterBar] No movies received');
        }
        
        if (!cinemasData || cinemasData.length === 0) {
          console.warn('[FilterBar] No cinemas received');
        }
        
        setLoading(false);
        console.log('[FilterBar] Loading complete');
      } catch (error) {
        if (isCancelled) {
          console.log('[FilterBar] Component unmounted during fetch');
          return;
        }
        
        // Para errores de cancelación en React Strict Mode
        if (axios.isAxiosError(error) && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) {
          console.log('[FilterBar] Request cancelled - this happens in React Strict Mode');
          // IMPORTANTE: Establecer loading false después de un pequeño delay
          // para dar tiempo a que la segunda solicitud complete
          setTimeout(() => {
            if (!isCancelled) {
              console.log('[FilterBar] Retry timeout - forcing loading to false');
              setLoading(false);
            }
          }, 1000);
          return;
        }
        
        console.error('[FilterBar] Error fetching data:', error);
        setLoading(false);
      }
    };

    // Timeout de seguridad: salir del loading después de 10 segundos
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        console.warn('[FilterBar] Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000);

    fetchData();
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Mapeo de nombres de cines a ciudades (temporal hasta que se corrija en BD)
  const cinemaToCity: Record<string, string> = {
    'Real Plaza Trujillo': 'La Libertad',
    'Angamos': 'Lima',
    'Arequipa': 'Arequipa',
    'Asia': 'Lima',
    'Bellavista': 'Callao',
    'Gamarra': 'Lima',
    'Jockey Plaza': 'Lima',
    'Lambra': 'Lima'
  };

  // Obtener películas - preferir NOW_PLAYING, pero mostrar todas si no hay ninguna
  const nowPlayingMovies = movies.filter(m => m.status === 'NOW_PLAYING');
  const moviesToShow = nowPlayingMovies.length > 0 ? nowPlayingMovies : movies;
  
  const movieOptions = Array.from(
    new Set(moviesToShow.map(p => p.title))
  ).sort();
  
  // Obtener ciudades únicas ordenadas alfabéticamente
  // Usar el mapeo para convertir nombres de cines a ciudades
  const cityOptions = Array.from(
    new Set(
      cinemas.map(c => cinemaToCity[c.location] || c.location)
    )
  ).sort();
  
  // Debug: mostrar qué tenemos
  console.log('[FilterBar] Render - Movies:', movies.length, 'Movie options:', movieOptions.length);
  console.log('[FilterBar] Render - Cinemas:', cinemas.length, 'City options:', cityOptions.length);
  if (movies.length > 0) {
    console.log('[FilterBar] NOW_PLAYING movies:', nowPlayingMovies.length);
    console.log('[FilterBar] Movie statuses:', Array.from(new Set(movies.map(m => m.status))));
  }
  if (cityOptions.length > 0) {
    console.log('[FilterBar] Cities available:', cityOptions);
  }
  
  // Filtrar cines por ciudad seleccionada
  const getCinesByCity = (cityName: string) => {
    if (!cityName) return [];
    return cinemas
      .filter(c => {
        const mappedCity = cinemaToCity[c.location] || c.location;
        return mappedCity === cityName;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const dateOptions = getDateOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;

    // Encontrar la película y cine seleccionados
    const selectedMovie = movies.find(m => m.title === movie);
    const selectedCinema = cinemas.find(c => c.id.toString() === cinema);
    
    if (selectedMovie && selectedCinema) {
      // Guardar el cine seleccionado en localStorage
      localStorage.setItem('selectedCine', JSON.stringify(selectedCinema));
      
      // Disparar evento para que Navbar se actualice
      window.dispatchEvent(new Event('storage'));
      
      // Navegar a detalle-pelicula con el ID de la película
      navigate(`/detalle-pelicula?pelicula=${selectedMovie.id}`);
    }
  };

  if (loading) {
    return (
      <section className="flex justify-center w-full py-8 bg-transparent">
        <div 
          style={{ background: "var(--cineplus-gray-light)" }}
          className="shadow-lg rounded-md flex flex-col md:flex-row items-stretch px-2 py-4 gap-4 md:gap-0 w-full max-w-2xl md:min-w-[700px] animate-pulse"
        >
          <div className="h-16 bg-gray-300 rounded flex-1"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex justify-center w-full py-8 bg-transparent">
      <form
        style={{ background: "var(--cineplus-gray-light)" }}
        className="shadow-lg rounded-md flex flex-col md:flex-row items-stretch px-2 py-4 gap-4 md:gap-0 w-full max-w-2xl md:min-w-[700px]"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por película</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white"
            style={{ 
              color: movie ? "var(--cineplus-gray-dark)" : "var(--cineplus-gray)", 
              border: "none",
              cursor: "pointer"
            }}
            value={movie}
            onChange={e => setMovie(e.target.value)}
          >
            <option value="" disabled>Qué quieres ver</option>
            {movieOptions.map((title, index) => (
              <option key={index} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por ciudad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white"
            style={{ 
              color: city ? "var(--cineplus-gray-dark)" : "var(--cineplus-gray)", 
              border: "none",
              cursor: "pointer"
            }}
            value={city}
            onChange={e => {
              setCity(e.target.value);
              setCinema("");
            }}
          >
            <option value="" disabled>Dónde estás</option>
            {cityOptions.map((cityName, index) => (
              <option key={index} value={cityName}>{cityName}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por cine/localidad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white"
            style={{ 
              color: cinema ? "var(--cineplus-gray-dark)" : "var(--cineplus-gray)", 
              border: "none",
              cursor: city ? "pointer" : "not-allowed"
            }}
            value={cinema}
            onChange={e => setCinema(e.target.value)}
            disabled={!city}
          >
            <option value="" disabled>Elige tu cine</option>
            {getCinesByCity(city).map((cine) => (
              <option key={cine.id} value={cine.id}>
                {cine.name} - {cine.location}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 px-0 md:px-6">
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por fecha</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white"
            style={{ 
              color: date ? "var(--cineplus-gray-dark)" : "var(--cineplus-gray)", 
              border: "none",
              cursor: "pointer"
            }}
            value={date}
            onChange={e => setDate(e.target.value)}
          >
            <option value="" disabled>Elige un día</option>
            {dateOptions.map((dateStr, index) => (
              <option key={index} value={dateStr}>{dateStr}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center pt-2 md:pt-0 md:pl-6 w-full md:w-auto">
          <button
            type="submit"
            disabled={!isReady}
            className={`flex items-center gap-2 font-semibold rounded-full px-6 py-2 transition w-full md:w-auto
              ${isReady
                ? "bg-[var(--cineplus-gray-dark)] text-[var(--cineplus-gray-light)] hover:bg-[var(--cineplus-black)]"
                : "bg-[var(--cineplus-gray)] text-[var(--cineplus-gray-light)] cursor-not-allowed"
              }`}
            style={{ border: "none" }}
          >
            <Sliders size={18} />
            Filtrar
          </button>
        </div>
      </form>
    </section>
  );
};

export default FilterBar;