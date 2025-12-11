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
    <div className="group">
      <div className="transform hover:scale-105 transition-all duration-300 hover:-translate-y-2">
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
      </div>
      {/* Información de la película debajo del card con hover effect */}
      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-bold text-base text-white line-clamp-2 group-hover:text-[#BB2228] transition-colors duration-300">
          {pelicula.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-neutral-400 flex-wrap">
          {pelicula.genre && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 group-hover:bg-[#BB2228]/20 transition-colors duration-300">
              {pelicula.genre}
            </span>
          )}
          {pelicula.classification && (
            <span className="font-semibold text-neutral-300 px-2 py-0.5 rounded bg-neutral-700/50">
              {pelicula.classification}
            </span>
          )}
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
    <div className="min-h-screen pt-16 text-neutral-100" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar izquierdo con efectos modernos */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 card-glass p-6 animate-slide-up">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                Filtrar Por
              </h3>
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
            {/* Header mejorado con degradado */}
            <div className="mb-8 pb-4 border-b border-white/5 animate-slide-up">
              <h2 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Películas
              </h2>
              <p className="text-neutral-400 text-lg">Descubre las mejores películas en cartelera</p>
            </div>

            {/* Grid de películas con animación escalonada */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center items-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#BB2228] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-neutral-400 font-semibold">Cargando películas...</p>
                  </div>
                </div>
              ) : movies.map((pelicula, index) => (
                <div 
                  key={pelicula.id ?? index}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <MovieCardWithShowtime
                    pelicula={pelicula}
                    activeTabIndex={activeTabIndex}
                    index={index}
                    selectedCinemaId={selectedCinemaId}
                  />
                </div>
              ))}
            </div>

            {/* Botón "Ver más" mejorado */}
            {hasMoreMovies && (
              <div className="flex justify-center mt-12 animate-fade-in">
                <button
                  onClick={loadMoreMovies}
                  className="btn-primary-gradient btn-shine inline-flex items-center gap-3 text-white font-bold px-8 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span className="text-lg">Ver más películas</span>
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
