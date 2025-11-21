import React, { useState, useEffect } from "react";
import { PlusCircle } from "react-feather";
import { fetchAllMovies } from "../services/moviesService";
import type { Movie, MovieStatus } from '../types/Movie';
import { useNavigate } from "react-router-dom";

const STATUS_TABS: { label: string; status: MovieStatus }[] = [
  { label: "En cartelera", status: 'NOW_PLAYING' },
  { label: "Preventa", status: 'PRESALE' },
  { label: "Próximos estrenos", status: 'UPCOMING' }
];

function filterMoviesByStatus(status: MovieStatus, movies: Movie[]): Movie[] {
  return movies.filter(m => m.status === status).slice(0, 5);
}

const MovieCarousel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchAllMovies();
        if (import.meta.env.MODE !== 'production') console.debug(`[MovieCarousel] fetched movies: ${Array.isArray(all) ? all.length : 'N/A'}`);
        if (!all || !Array.isArray(all) || all.length === 0) {
          console.warn('[MovieCarousel] no movies returned from fetchAllMovies');
        }
        setMovies(all);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleVerDetalles = (movieId: string) => {
    navigate(`/detalle-pelicula?pelicula=${movieId}`);
  };

  if (loading) {
    return (
      <section className="w-full max-w-[1070px] mx-auto mt-4 px-0" style={{paddingLeft: 80, paddingRight: 80, background: "var(--cineplus-black)"}}>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-[420px_220px_220px] gap-2 mx-auto items-start justify-center w-full" style={{height: 608}}>
            <div className="bg-gray-700 rounded" style={{width: 420, height: 608}}></div>
            <div className="flex flex-col gap-2">
              <div className="bg-gray-700 rounded" style={{width: 220, height: 300}}></div>
              <div className="bg-gray-700 rounded" style={{width: 220, height: 300}}></div>
            </div>
            <div className="bg-gray-700 rounded" style={{width: 220, height: 608}}></div>
          </div>
        </div>
      </section>
    );
  }

  const currentMovies = filterMoviesByStatus(STATUS_TABS[activeTab].status, movies);

  return (
    <section className="w-full max-w-[1070px] mx-auto mt-4 px-0" style={{paddingLeft: 80, paddingRight: 80, background: "var(--cineplus-black)"}}>
      <h2 className="text-[64px] leading-none font-extrabold mb-2 pt-2 pl-2" style={{fontFamily: 'inherit', color: 'var(--cineplus-gray-light)'}}>Películas</h2>
      <div className="flex gap-2 border-b-2 mb-6 pl-2" style={{borderColor: 'var(--cineplus-gray)'}}>
        {STATUS_TABS.map((tab, idx) => (
          <button
            key={tab.status}
            className={`pb-2 px-1 text-xl font-semibold transition border-b-2 ${idx === activeTab ? 'border-[var(--cineplus-gray)] text-[var(--cineplus-gray-light)]' : 'border-transparent text-[var(--cineplus-gray)] hover:text-[var(--cineplus-gray-light)]'}`}
            onClick={() => setActiveTab(idx)}
            style={{fontFamily: 'inherit'}}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="showtimes-grid grid grid-cols-[420px_220px_220px] gap-2 mx-auto items-start justify-center w-full" style={{height: 608}}>
        {/* Póster grande a la izquierda */}
        <div className="rounded shadow flex items-center justify-center overflow-hidden relative group" style={{width: 420, height: 608, background: 'var(--cineplus-gray-dark)'}}>
          {currentMovies[0] && (
            <>
              <img src={currentMovies[0].posterUrl || '/placeholder.jpg'} alt={currentMovies[0].title} className="object-cover w-full h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button 
                  className="cursor-pointer flex items-center gap-2 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition-all" 
                  style={{ backgroundColor: "#BB2228", color: "#EFEFEE" }}
                  onClick={() => handleVerDetalles(String(currentMovies[0].id))}
                >
                  <PlusCircle size={20}/> Ver detalles
                </button>
              </div>
            </>
          )}
        </div>

        {/* Grid de pósters medianos */}
        <div className="flex flex-col gap-2" style={{width: 220, height: 608}}>
          {currentMovies.slice(1, 2).map((p) => (
            <div key={p.id} className="relative rounded shadow overflow-hidden flex items-center justify-center group" style={{width: 220, height: 300, background: 'var(--cineplus-gray-dark)'}}>
              <img src={p.posterUrl || '/placeholder.jpg'} alt={p.title} className="object-cover w-full h-full" />
              {activeTab === 0 && (
                <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg" style={{fontFamily: 'inherit'}}>Estreno</span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button 
                  className="cursor-pointer flex items-center gap-2 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition-all" 
                  style={{ backgroundColor: "#BB2228", color: "#EFEFEE" }}
                  onClick={() => handleVerDetalles(String(p.id))}
                >
                  <PlusCircle size={20}/> Ver detalles
                </button>
              </div>
            </div>
          ))}
          {currentMovies.slice(3, 4).map((p) => (
            <div key={p.id} className="relative rounded shadow overflow-hidden flex items-center justify-center group" style={{width: 220, height: 300, background: 'var(--cineplus-gray-dark)'}}>
              <img src={p.posterUrl || '/placeholder.jpg'} alt={p.title} className="object-cover w-full h-full" />
              {activeTab === 0 && (
                <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg" style={{fontFamily: 'inherit'}}>Estreno</span>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button 
                  className="cursor-pointer flex items-center gap-2 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 transition-all" 
                  style={{ backgroundColor: "#BB2228", color: "#EFEFEE" }}
                  onClick={() => handleVerDetalles(String(p.id))}
                >
                  <PlusCircle size={20}/> Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Botón vertical "Ver más películas" */}
        <div
          className="flex flex-col justify-center items-center rounded shadow"
          style={{
            width: 220,
            height: 608,
            background: 'linear-gradient(to bottom, #393A3A, #141113)',
          }}
        >
          <button
            className="cursor-pointer text-2xl font-bold px-4 py-8 transition duration-300 ease-in-out hover:brightness-75"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: 'inherit',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#EFEFEE'
            }}
            onClick={() => navigate('/cartelera')}
          >
            Ver más películas
          </button>
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;