import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieCard from "../components/MovieCard";
import FilterDropdown from "../components/FilterDropdown";
import { peliculas } from "../data/peliculas";
import { useLocation } from "react-router-dom";

interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  genero: string;
  clasificacion: string;
  duracion: string;
  banner?: string;
  imagenCard?: string;
  trailerUrl?: string;
  reparto?: string[];
  horarios?: string[];
}

const TABS = ["En cartelera", "Pre-venta", "Próximos estrenos"];

function getPeliculasByTab(tabIdx: number) {
  if (tabIdx === 0) {
    return peliculas.slice(0, 23);
  } else if (tabIdx === 1) {
    return peliculas.slice(23, 32);
  } else if (tabIdx === 2) {
    return peliculas.slice(32, 47);
  } else {
    return [];
  }
}

const Cartelera: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("En cartelera");
  const [visibleMovies, setVisibleMovies] = useState(6);
  const [selectedCine, setSelectedCine] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    // Obtener el cine desde la URL (query parameter)
    const params = new URLSearchParams(location.search);
    const cineFromUrl = params.get("cine");

    if (cineFromUrl) {
      setSelectedCine(cineFromUrl); // Establecer el cine seleccionado desde la URL
    } else {
      const savedCine = localStorage.getItem("selectedCine");
      if (savedCine) {
        setSelectedCine(savedCine); // Recuperar desde localStorage si no está en la URL
      }
    }
  }, [location]);

  const activeTabIndex = TABS.indexOf(selectedCategory);
  const allMovies = getPeliculasByTab(activeTabIndex);
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
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex">
          {/* Sidebar izquierdo */}
          <div className="w-64 p-6 border-r" style={{ borderColor: "var(--cineplus-gray)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cineplus-gray-light)" }}>Filtrar Por:</h3>

            <div className="space-y-4">
              <FilterDropdown
                options={TABS}
                selectedOption={selectedCategory}
                onSelect={handleCategoryChange}
                placeholder="Categoría"
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2" style={{ color: "var(--cineplus-gray-light)" }}>Películas</h2>
              <p className="text-lg" style={{ color: "var(--cineplus-gray)" }}>Descubre las mejores películas en cartelera</p>
            </div>

            {/* Grid de películas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {movies.map((pelicula, index) => (
                <div key={pelicula.id} className="aspect-[2/3] transform hover:scale-105 transition-transform duration-300">
                  <MovieCard 
                    pelicula={pelicula} 
                    showEstrenoLabel={activeTabIndex === 0 && index < 6}
                    showPreventaLabel={activeTabIndex === 1}
                  />
                </div>
              ))}
            </div>

            {hasMoreMovies && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={loadMoreMovies}
                  className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <img src="/logo-white.png" alt="Logo" className="w-14 h-14" />
                  Ver más Películas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cartelera;
