
import React, { useState } from "react";
import { ShoppingCart, PlusCircle } from "react-feather";
import { peliculas } from "../data/peliculas";


const TABS = ["En cartelera", "Preventa", "Próximos estrenos"];


function getPeliculasByTab(tabIdx: number) {
  if (tabIdx === 0) {
    // Cartelera: las primeras 5
    return peliculas.slice(0, 5);
  } else if (tabIdx === 1) {
    // Preventa: las siguientes 5
    return peliculas.slice(5, 10);
  } else if (tabIdx === 2) {
    // Próximos estrenos: las siguientes 5
    return peliculas.slice(10, 15);
  } else {
    return [];
  }
}

const MovieCarousel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
  <section className="w-full max-w-[1070px] mx-auto mt-4 px-0" style={{paddingLeft: 80, paddingRight: 80, background: "var(--cineplus-black)"}}>
    <h2 className="text-[64px] leading-none font-extrabold mb-2 pt-2 pl-2" style={{fontFamily: 'inherit', color: 'var(--cineplus-gray-light)'}}>Películas</h2>
    <div className="flex gap-2 border-b-2 mb-6 pl-2" style={{borderColor: 'var(--cineplus-gray)'}}>
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            className={`pb-2 px-1 text-xl font-semibold transition border-b-2 ${idx === activeTab ? 'border-[var(--cineplus-gray)] text-[var(--cineplus-gray-light)]' : 'border-transparent text-[var(--cineplus-gray)] hover:text-[var(--cineplus-gray-light)]'}`}
            onClick={() => setActiveTab(idx)}
            style={{fontFamily: 'inherit'}}
          >
            {tab}
          </button>
        ))}
      </div>
          <div className="showtimes-grid grid grid-cols-[420px_220px_220px] gap-2 mx-auto items-start justify-center w-full" style={{height: 608}}>
        {/* Póster grande a la izquierda */}
  <div className="rounded shadow flex items-center justify-center overflow-hidden relative group" style={{width: 420, height: 608, background: 'var(--cineplus-gray-dark)'}}>
          {getPeliculasByTab(activeTab)[0] && (
            <>
              <img src={getPeliculasByTab(activeTab)[0].imagenCard} alt={getPeliculasByTab(activeTab)[0].titulo} className="object-cover w-full h-full" />
              {/* Overlay de botones al hacer hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button className="cursor-pointer flex items-center gap-2 bg-[#e50914] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#b0060f] transition-all" onClick={() => window.location.href = `/boletos?pelicula=${getPeliculasByTab(activeTab)[0].id}`}> <ShoppingCart size={20}/> Comprar</button>
                <button className="cursor-pointer flex items-center gap-2 bg-[#0a3cff] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#072a99] transition-all" onClick={() => window.location.href = `/detalle?pelicula=${getPeliculasByTab(activeTab)[0].id}`}> <PlusCircle size={20}/> Ver detalles</button>
              </div>
            </>
          )}
        </div>
        {/* Grid de 4 pósters medianos a la derecha en 2x2 */}
  <div className="flex flex-col gap-2" style={{width: 220, height: 608}}>
          {getPeliculasByTab(activeTab).slice(1, 2).map((p) => (
            <div key={p.id} className="relative rounded shadow overflow-hidden flex items-center justify-center group" style={{width: 220, height: 300, background: 'var(--cineplus-gray-dark)'}}>
              <img src={p.imagenCard} alt={p.titulo} className="object-cover w-full h-full" />
              {activeTab === 0 && (
                <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg" style={{fontFamily: 'inherit'}}>Estreno</span>
              )}
              {/* Overlay de botones al hacer hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button className="cursor-pointer flex items-center gap-2 bg-[#e50914] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#b0060f] transition-all" onClick={() => window.location.href = `/boletos?pelicula=${p.id}`}> <ShoppingCart size={20}/> Comprar</button>
                <button className="cursor-pointer flex items-center gap-2 bg-[#0a3cff] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#072a99] transition-all" onClick={() => window.location.href = `/detalle?pelicula=${p.id}`}> <PlusCircle size={20}/> Ver detalles</button>
              </div>
            </div>
          ))}
          {getPeliculasByTab(activeTab).slice(3, 4).map((p) => (
            <div key={p.id} className="relative rounded shadow overflow-hidden flex items-center justify-center group" style={{width: 220, height: 300, background: 'var(--cineplus-gray-dark)'}}>
              <img src={p.imagenCard} alt={p.titulo} className="object-cover w-full h-full" />
              {activeTab === 0 && (
                <span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg" style={{fontFamily: 'inherit'}}>Estreno</span>
              )}
              {/* Overlay de botones al hacer hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 bg-black/40 backdrop-blur-sm" style={{backdropFilter: 'blur(6px)'}}>
                <button className="cursor-pointer flex items-center gap-2 bg-[#e50914] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#b0060f] transition-all" onClick={() => window.location.href = `/boletos?pelicula=${p.id}`}> <ShoppingCart size={20}/> Comprar</button>
                <button className="cursor-pointer flex items-center gap-2 bg-[#0a3cff] text-white font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:scale-105 hover:bg-[#072a99] transition-all" onClick={() => window.location.href = `/detalle?pelicula=${p.id}`}> <PlusCircle size={20}/> Ver detalles</button>
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
            background: 'linear-gradient(to bottom,rgb(185, 185, 185),rgb(73, 72, 72))', // degradado plateado
          }}
        >
          <button
            className="cursor-pointer text-white text-2xl font-bold px-4 py-8 transition duration-300 ease-in-out hover:brightness-110"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: 'inherit',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = '/cartelera'}
          >
            Ver más películas
          </button>
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;
