import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sliders } from "react-feather";
import { getMovies, type Pelicula } from "../services/moviesService";
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

  const isReady = movie && city && cinema && date;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesData, cinemasData] = await Promise.all([
          getMovies(),
          getAllCinemas()
        ]);
        setMovies(moviesData);
        setCinemas(cinemasData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const movieOptions = Array.from(new Set(movies.map(p => p.titulo)));
  const cityOptions = Array.from(new Set(cinemas.map(c => c.city)));
  const getCinesByCity = (city: string) => {
    if (!city) return [];
    return cinemas.filter(c => c.city === city);
  };
  const dateOptions = getDateOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReady) {
      const selectedMovie = movies.find(m => m.titulo === movie);
      if (selectedMovie) {
        navigate(`/detalle-pelicula?pelicula=${selectedMovie.id}`);
      }
    }
  };

  if (loading) {
    return (
      <section className="flex justify-center w-full -mt-12 z-20 relative">
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
    <section className="flex justify-center w-full py-8 bg-black">
      <form
        style={{ background: "var(--cineplus-gray-light)" }}
        className="shadow-lg rounded-md flex flex-col md:flex-row items-stretch px-2 py-4 gap-4 md:gap-0 w-full max-w-2xl md:min-w-[700px]"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por película</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white [&>option:hover]:text-white [&>option:hover]:bg-gray-300"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={movie}
            onChange={e => setMovie(e.target.value)}
          >
            <option value="">Qué quieres ver</option>
            {movieOptions.map((title, index) => (
              <option key={index} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 min-w-0 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por ciudad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white [&>option:hover]:text-white [&>option:hover]:bg-gray-300"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={city}
            onChange={e => {
              setCity(e.target.value);
              setCinema("");
            }}
          >
            <option value="">Dónde estás</option>
            {cityOptions.map((city, index) => (
              <option key={index} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 px-0 md:px-6 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por cine/localidad</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white [&>option:hover]:text-white [&>option:hover]:bg-gray-300"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={cinema}
            onChange={e => setCinema(e.target.value)}
            disabled={!city}
          >
            <option value="">Elige tu cine/localidad</option>
            {getCinesByCity(city).map((cine) => (
              <option key={cine.id} value={cine.id}>
                {cine.location} ({cine.name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center flex-1 px-0 md:px-6">
          <label className="font-bold text-base mb-0" style={{ color: "var(--cineplus-gray-dark)" }}>Por fecha</label>
          <select
            className="text-sm bg-transparent focus:outline-none w-full [&>option]:text-black [&>option]:bg-white [&>option:hover]:text-white [&>option:hover]:bg-gray-300"
            style={{ color: "var(--cineplus-gray)", border: "none" }}
            value={date}
            onChange={e => setDate(e.target.value)}
          >
            <option value="">Elige un día</option>
            {dateOptions.map((date, index) => (
              <option key={index} value={date}>{date}</option>
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