import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiX, FiMinus, FiPlus } from "react-icons/fi";
import { getMovies, type Pelicula } from "../services/moviesService";
import { getMovieSelection, getSelectedCine } from "../utils/storage";

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

const Carrito: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  
  const peliculaId = searchParams.get('pelicula');
  const day = searchParams.get('day');
  const time = searchParams.get('time');
  const format = searchParams.get('format');

  useEffect(() => {
    const sel = getMovieSelection();
    const cine = getSelectedCine();

    if (sel) {
      setMovieSelection(sel);
      if (sel.pelicula) setPelicula(sel.pelicula);
    }

    if (cine) {
      // getSelectedCine returns the Cinema object
      setSelectedCine((cine as any).name || null);
    }

    // If we don't have a pelicula from storage, try to fetch by query param
    if (!sel?.pelicula && peliculaId) {
      getMovies().then(movies => {
        const found = movies.find(m => m.id === peliculaId);
        if (found) setPelicula(found);
      }).catch(() => {
        // ignore - fallback handled by service
      });
    }
  }, [peliculaId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const tiposEntrada = {
    general: [
      { id: 'promo-online', nombre: 'PROMO ONLINE', precio: 14.96 },
      { id: 'persona-discapacidad', nombre: 'PERSONA CON DISCAPACIDAD', precio: 17.70 },
      { id: 'silla-ruedas', nombre: 'SILLA DE RUEDAS', precio: 17.70 },
      { id: 'nino', nombre: 'NIÑO', precio: 21.60 },
      { id: 'adulto', nombre: 'ADULTO', precio: 23.60 }
    ],
    convenios: [
      { id: 'banco-ripley', nombre: '50% DCTO BANCO RIPLEY', precio: 12.80 }
    ]
  };

  const agregarEntrada = (tipo: any) => {
    const existente = entradas.find(e => e.id === tipo.id);
    if (existente) {
      setEntradas(entradas.map(e => 
        e.id === tipo.id ? { ...e, cantidad: e.cantidad + 1 } : e
      ));
    } else {
      setEntradas([...entradas, { ...tipo, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setEntradas(entradas.map(e => {
      if (e.id === id) {
        const nuevaCantidad = e.cantidad + delta;
        return { ...e, cantidad: nuevaCantidad };
      }
      return e;
    }).filter(e => e.cantidad > 0));
  };

  const total = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Entradas</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex">
        {/* Contenido principal */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">ELIJA SUS ENTRADAS</h2>
            
            {/* Botón cupón */}
            <button className="bg-white text-black px-6 py-2 rounded-full font-semibold mb-8">
              TENGO UN CUPÓN
            </button>

            {/* Sección General */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">GENERAL</h3>
              <div className="grid grid-cols-2 gap-4">
                {tiposEntrada.general.map((tipo) => {
                  const entrada = entradas.find(e => e.id === tipo.id);
                  const isSelected = !!entrada;
                  
                  return (
                    <div key={tipo.id} className={`relative border rounded-lg p-4 transition-all ${
                      isSelected ? 'border-white bg-white text-black' : 'border-gray-600 hover:border-gray-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border-2 border-current rounded flex items-center justify-center">
                            <div className="w-4 h-4 bg-current rounded"></div>
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{tipo.nombre}</div>
                            <div className="text-sm">S/ {tipo.precio.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, -1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, 1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="text-2xl font-bold"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección Convenios */}
            <div>
              <h3 className="text-xl font-bold mb-4">CONVENIOS</h3>
              <div className="grid grid-cols-2 gap-4">
                {tiposEntrada.convenios.map((tipo) => {
                  const entrada = entradas.find(e => e.id === tipo.id);
                  const isSelected = !!entrada;
                  
                  return (
                    <div key={tipo.id} className={`relative border rounded-lg p-4 transition-all ${
                      isSelected ? 'border-white bg-white text-black' : 'border-gray-600 hover:border-gray-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 border-2 border-current rounded flex items-center justify-center">
                            <div className="w-4 h-4 bg-current rounded"></div>
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{tipo.nombre}</div>
                            <div className="text-sm">S/ {tipo.precio.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, -1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, 1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="text-2xl font-bold"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
          {/* Información de la película */}
          {(movieSelection?.pelicula || pelicula) && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={(movieSelection?.pelicula || pelicula)?.imagenCard} 
                  alt={(movieSelection?.pelicula || pelicula)?.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{(movieSelection?.pelicula || pelicula)?.titulo.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{movieSelection?.selectedFormat || format} - Doblada</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex-shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{movieSelection?.selectedCine || selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate((movieSelection?.selectedDay || day) || '')} - {movieSelection?.selectedTime || time}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de entradas seleccionadas */}
          {entradas.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Entradas</h4>
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white rounded"></div>
                      <div>
                        <div className="text-sm font-medium">{entrada.cantidad} - {entrada.nombre}</div>
                        <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {entrada.precio.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => cambiarCantidad(entrada.id, -1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{entrada.cantidad}</span>
                      <button 
                        onClick={() => cambiarCantidad(entrada.id, 1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cargo por servicio */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Cargo por servicio online</div>
                    <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Incluye el cargo por servicio online</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <div 
              className={`p-4 rounded flex items-center justify-between ${
                entradas.length > 0 
                  ? 'bg-white text-black cursor-pointer' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              onClick={() => {
                if (entradas.length > 0) {
                  localStorage.setItem('selectedEntradas', JSON.stringify(entradas));
                  window.location.href = '/butacas';
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${
                  entradas.length > 0 ? 'bg-black' : 'bg-gray-400'
                }`}></div>
                <span className="font-bold">S/ {total.toFixed(2)}</span>
              </div>
              <span className="font-bold">
                CONTINUAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
