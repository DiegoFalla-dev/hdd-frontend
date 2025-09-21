import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieCard from "../components/MovieCard";
import FilterDropdown from "../components/FilterDropdown";
import { peliculas } from "../data/peliculas";

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

const TABS = ["En cartelera", "Preventa", "Próximos estrenos"];

function getPeliculasByTab(tabIdx: number) {
  if (tabIdx === 0) {
    return peliculas.slice(0, 5);
  } else if (tabIdx === 1) {
    return peliculas.slice(5, 10);
  } else if (tabIdx === 2) {
    return peliculas.slice(10, 15);
  } else {
    return [];
  }
}

const Cartelera: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("En cartelera");
  const activeTabIndex = TABS.indexOf(selectedCategory);
  const movies = getPeliculasByTab(activeTabIndex);

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
                onSelect={setSelectedCategory}
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
              {movies.map((pelicula) => (
                <div key={pelicula.id} className="aspect-[2/3] transform hover:scale-105 transition-transform duration-300">
                  <MovieCard 
                    pelicula={pelicula} 
                    showEstrenoLabel={activeTabIndex === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cartelera;