import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import FilterDropdown from '../components/FilterDropdown';
import { getMovies } from '../services/moviesService';

const TABS = ['En cartelera', 'Pre-venta', 'Próximos estrenos'];

import type { Pelicula } from '../services/moviesService';

function getPeliculasByTab(tabIdx: number, source: Pelicula[] = []) {
  if (tabIdx === 0) {
    return source.slice(0, 23);
  } else if (tabIdx === 1) {
    return source.slice(23, 32);
  } else if (tabIdx === 2) {
    return source.slice(32, 47);
  } else {
    return [];
  }
}

const Cartelera: React.FC = () => {
  const [moviesData, setMoviesData] = useState<Pelicula[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('En cartelera');
  const [visibleMovies, setVisibleMovies] = useState(6);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const m = await getMovies();
      if (!mounted) return;
      setMoviesData(m as Pelicula[]);
    })();
    return () => { mounted = false; };
  }, []);

  const activeTabIndex = TABS.indexOf(selectedCategory);
  const allMovies = getPeliculasByTab(activeTabIndex, moviesData);
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
              {movies.map((pelicula, index) => (
                <div key={pelicula.id ?? index} className="transform hover:scale-105 transition-transform duration-300">
                  <MovieCard
                    pelicula={pelicula}
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
                  <span>Ver más Películas</span>
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
