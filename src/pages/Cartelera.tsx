import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import FilterDropdown from '../components/FilterDropdown';
import { useAllMovies } from '../hooks/useMovies';
import type { Movie, MovieStatus } from '../types/Movie';

const TABS: { label: string; status: MovieStatus }[] = [
  { label: 'En cartelera', status: 'NOW_PLAYING' },
  { label: 'Pre-venta', status: 'PRESALE' },
  { label: 'Próximos estrenos', status: 'UPCOMING' }
];

function filterByStatus(status: MovieStatus, source: Movie[]): Movie[] {
  return source.filter(m => m.status === status);
}

const Cartelera: React.FC = () => {
  const { data: moviesData = [], isLoading } = useAllMovies();
  const [selectedCategory, setSelectedCategory] = useState(TABS[0].label);
  const [visibleMovies, setVisibleMovies] = useState(6);

  const activeTabIndex = TABS.findIndex(t => t.label === selectedCategory);
  const allMovies = activeTabIndex >= 0 ? filterByStatus(TABS[activeTabIndex].status, moviesData) : [];
  const movies = allMovies.slice(0, visibleMovies);
  const hasMoreMovies = visibleMovies < allMovies.length;

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
                <div key={pelicula.id ?? index} className="transform hover:scale-105 transition-transform duration-300">
                  <MovieCard
                    pelicula={{
                      id: String(pelicula.id),
                      titulo: pelicula.title,
                      imagenCard: pelicula.posterUrl,
                      genero: pelicula.genre,
                      status: pelicula.status === 'NOW_PLAYING' ? 'CARTELERA' : pelicula.status === 'PRESALE' ? 'PREVENTA' : 'PROXIMO'
                    }}
                    showEstrenoLabel={activeTabIndex === 0 && index < 6}
                    showPreventaLabel={activeTabIndex === 1}
                  />
                </div>
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
