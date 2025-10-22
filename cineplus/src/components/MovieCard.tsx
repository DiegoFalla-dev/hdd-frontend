import React from "react";
import { ShoppingCart, PlusCircle } from "react-feather";
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

interface MovieCardProps {
  pelicula: Pelicula;
  showEstrenoLabel?: boolean;
  showPreventaLabel?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ pelicula, showEstrenoLabel = false, showPreventaLabel = false }) => {
  return (
    <div className="relative rounded shadow overflow-hidden flex items-center justify-center group" style={{background: 'var(--cineplus-gray-dark)'}}>
      {pelicula.imagenCard ? (
        <img src={pelicula.imagenCard} alt={pelicula.titulo} className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{background: 'var(--cineplus-gray-medium)'}}>
          <div className="text-center p-4">
            <h3 className="font-bold text-lg mb-2" style={{color: 'var(--cineplus-gray-light)'}}>{pelicula.titulo}</h3>
            <p className="text-sm" style={{color: 'var(--cineplus-gray)'}}>{pelicula.genero}</p>
          </div>
        </div>
      )}
      {showEstrenoLabel && (
        <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg">Estreno</span>
      )}
      {showPreventaLabel && (
        <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg">Pre-venta</span>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 backdrop-blur-sm">
        <button className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b0060f] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" onClick={() => window.location.href = `/boletos?pelicula=${pelicula.id}`}> 
          <ShoppingCart size={18}/> Comprar
        </button>
        <button className="flex items-center gap-2 bg-[#0a3cff] hover:bg-[#072a99] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" onClick={() => window.location.href = `/detalle?pelicula=${pelicula.id}`}> 
          <PlusCircle size={18}/> Ver detalles
        </button>
      </div>
    </div>
  );
};

export default MovieCard;