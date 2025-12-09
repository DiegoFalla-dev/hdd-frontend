import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import FilterDropdown from '../components/FilterDropdown';
import { useAllMovies } from '../hooks/useMovies';
import { useFirstShowtime } from '../hooks/useFirstShowtime';
import type { Movie, MovieStatus } from '../types/Movie';
import type { Cinema } from '../types/Cinema';

const TABS: { label: string; status: MovieStatus }[] = [
  { label: 'En cartelera', status: 'NOW_PLAYING' },
  { label: 'Pre-venta', status: 'PRESALE' },
  { label: 'Próximos estrenos', status: 'UPCOMING' }
];

function filterByStatus(status: MovieStatus, source: Movie[]): Movie[] {
  return source.filter(m => m.status === status);
}

// Componente interno para manejar cada MovieCard con su showtime
const MovieCardWithShowtime: React.FC<{ 
  pelicula: Movie; 
  activeTabIndex: number; 
  index: number;
  selectedCinemaId: number | null;
}> = ({ pelicula, activeTabIndex, index, selectedCinemaId }) => {
  const isPresale = activeTabIndex === 1; // Tab de Pre-venta
  
  // Solo obtener showtime si es preventa y hay un cine seleccionado
  const { data: firstShowtime } = useFirstShowtime({
    movieId: pelicula.id,
    cinemaId: selectedCinemaId || undefined,
    enabled: isPresale && !!selectedCinemaId
  });
  
  // Extraer la fecha del showtime (puede venir en startTime o en date)
  const showtimeDate = firstShowtime?.startTime 
    ? new Date(firstShowtime.startTime).toISOString().split('T')[0]
    : firstShowtime?.date || null;
  
  const isProximo = activeTabIndex === 2; // Tab de Próximos estrenos
  
  return (
    <div className="transform hover:scale-105 transition-transform duration-300">
      <MovieCard
        pelicula={{
          id: String(pelicula.id),
          titulo: pelicula.title,
          imagenCard: pelicula.posterUrl,
          genero: pelicula.genre,
          status: pelicula.status === 'NOW_PLAYING' ? 'CARTELERA' : pelicula.status === 'PRESALE' ? 'PREVENTA' : 'PROXIMO'
        }}
        showEstrenoLabel={activeTabIndex === 0 && index < 6}
        showPreventaLabel={isPresale}
        showProximoLabel={isProximo}
        firstShowtimeDate={isPresale ? showtimeDate : null}
      />
      {/* Información de la película debajo del card */}
      <div className="mt-3 space-y-1">
        <h3 className="font-bold text-base text-white line-clamp-2">{pelicula.title}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          {pelicula.genre && <span>{pelicula.genre}</span>}
          {pelicula.genre && (pelicula.classification || pelicula.duration) && <span>•</span>}
          {pelicula.classification && <span className="font-semibold text-neutral-300">{pelicula.classification}</span>}
          {pelicula.classification && pelicula.duration && <span>•</span>}
          {pelicula.duration && <span>{pelicula.duration}</span>}
        </div>
      </div>
    </div>
  );
};

const Cartelera: React.FC = () => {
  const { data: moviesData = [], isLoading } = useAllMovies();
  const [selectedCategory, setSelectedCategory] = useState(TABS[0].label);
  const [visibleMovies, setVisibleMovies] = useState(6);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);

  const activeTabIndex = TABS.findIndex(t => t.label === selectedCategory);
  const allMovies = activeTabIndex >= 0 ? filterByStatus(TABS[activeTabIndex].status, moviesData) : [];
  const movies = allMovies.slice(0, visibleMovies);
  const hasMoreMovies = visibleMovies < allMovies.length;

  // Cargar el cine seleccionado desde localStorage
  useEffect(() => {
    const loadSelectedCinema = () => {
      const savedCinema = localStorage.getItem('selectedCine');
      if (savedCinema) {
        try {
          const parsed = JSON.parse(savedCinema) as Cinema;
          setSelectedCinemaId(parsed.id);
        } catch (e) {
          console.error('Error parsing selectedCine:', e);
        }
      }
    };
    
    loadSelectedCinema();
    
    // Escuchar cambios en el localStorage (cuando se selecciona otro cine)
    const onStorage = () => loadSelectedCinema();
    window.addEventListener('storage', onStorage);
    
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setVisibleMovies(6);
  };

  const loadMoreMovies = () => {
    setVisibleMovies((prev) => prev + 6);
  };

  return (
    <div className="min-h-screen pt-16 bg-neutral-900 text-neutral-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar izquierdo */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-neutral-800/40 backdrop-blur rounded-lg p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold mb-4">Filtrar Por:</h3>
              <div className="space-y-4">
                <FilterDropdown
                  options={TABS}
                  selectedOption={selectedCategory}
                  onSelect={handleCategoryChange}
                  placeholder="Categoría"
                />
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <section className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-4xl font-extrabold tracking-tight mb-2">Películas</h2>
              <p className="text-neutral-300">Descubre las mejores películas en cartelera</p>
            </div>

            {/* Grid de películas */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center">Cargando...</div>
              ) : movies.map((pelicula, index) => (
                <MovieCardWithShowtime
                  key={pelicula.id ?? index}
                  pelicula={pelicula}
                  activeTabIndex={activeTabIndex}
                  index={index}
                  selectedCinemaId={selectedCinemaId}
                />
              ))}
            </div>

            {hasMoreMovies && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMoreMovies}
                  className="inline-flex items-center gap-3 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
                  style={{ background: 'linear-gradient(90deg, var(--cinepal-primary), var(--cinepal-primary-700))' }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <img src="https://i.imgur.com/K9o09F6.png" alt="Logo" />
                  </div>
                  <span>Ver más películas</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cartelera;
