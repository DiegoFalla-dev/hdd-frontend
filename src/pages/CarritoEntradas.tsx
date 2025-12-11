import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiMinus, FiPlus } from "react-icons/fi";
import { getMovies, type Pelicula } from "../services/moviesService";
import { useShowtimeSelectionStore } from "../store/showtimeSelectionStore";
import { useShowtimes } from "../hooks/useShowtimes";
import { useTicketTypes } from "../hooks/useTicketTypes";

interface Entrada {
  id: string;
  code: string; // código del ticket type en el backend
  nombre: string;
  precio: number;
  cantidad: number;
}

const Carrito: React.FC = () => {
  const navigate = useNavigate();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const selection = useShowtimeSelectionStore(s => s.selection);
  const peliculaId = selection?.movieId ? String(selection.movieId) : null;
  const day = selection?.date;
  const time = selection?.time;
  const format = selection?.format;
  const cinemaId = selection?.cinemaId;
  const showtimesQuery = useShowtimes({ movieId: selection?.movieId, cinemaId, date: day });
  const { data: ticketTypes, isLoading: ticketTypesLoading } = useTicketTypes();
  
  const showtimeId = selection?.showtimeId || showtimesQuery.data?.find(st => {
    const localTime = new Date(st.startTime).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
    const localDate = new Date(st.startTime).toISOString().split('T')[0];
    return localTime === time && localDate === day && st.format === format;
  })?.id;

  // Mapear ticket types del backend a categorías
  const tiposEntrada = useMemo(() => {
    if (!ticketTypes) return { general: [], convenios: [] };
    
    console.log('🎫 TicketTypes recibidos del backend:', ticketTypes);
    console.log('🎫 Total ticketTypes:', ticketTypes.length);
    
    const general = ticketTypes
      .filter(tt => tt.active && !tt.code.includes('DCTO'))
      .map(tt => ({
        id: `ticket-${tt.id}`, // Usar el ID del backend para garantizar unicidad
        code: tt.code,
        nombre: tt.name,
        precio: tt.price
      }));
    
    console.log('✅ General mapeados:', general.length, general);
    
    const convenios = ticketTypes
      .filter(tt => tt.active && tt.code.includes('DCTO'))
      .map(tt => ({
        id: `ticket-${tt.id}`, // Usar el ID del backend para garantizar unicidad
        code: tt.code,
        nombre: tt.name,
        precio: tt.price
      }));
    
    console.log('✅ Convenios mapeados:', convenios.length, convenios);
    
    return { general, convenios };
  }, [ticketTypes]);

  useEffect(() => {
    if (peliculaId) {
      getMovies().then(movies => {
        const found = movies.find(m => String(m.id) === peliculaId);
        if (found) setPelicula(found);
      }).catch(()=>{});
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

  // Loading state
  if (ticketTypesLoading) {
    return (
      <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando tipos de entrada...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)", color: "var(--cineplus-gray-light)" }} className="min-h-screen animate-fade-in">
      {/* Header mejorado */}
      <div className="flex justify-between items-center p-6 border-b border-white/5 backdrop-blur-sm" style={{ background: 'rgba(57, 58, 58, 0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></div>
          <h1 className="text-2xl font-black">Selección de Entradas</h1>
        </div>
        <button 
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          onClick={() => window.history.back()}
        >
          <FiX size={28} />
        </button>
      </div>

      <div className="flex">
        {/* Contenido principal */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl animate-slide-up">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#EFEFEE] to-[#BB2228] bg-clip-text text-transparent">ELIJA SUS ENTRADAS</h2>
            
            {/* Botón cupón */}
            <button className="btn-primary-gradient px-8 py-3 rounded-full font-semibold mb-8 hover:scale-105 transition-transform duration-300 shadow-lg">
              🎟️ TENGO UN CUPÓN
            </button>

            {/* Sección General */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-5 text-[#EFEFEE]">GENERAL</h3>
              <div className="grid grid-cols-2 gap-5">
                {tiposEntrada.general.map((tipo, index) => {
                  const entrada = entradas.find(e => e.id === tipo.id);
                  const isSelected = !!entrada;
                  
                  return (
                    <div key={tipo.id} 
                      className={`relative rounded-xl p-5 transition-all duration-300 transform hover:scale-105 animate-scale-in ${
                        isSelected ? 'btn-primary-gradient shadow-xl scale-105' : 'card-glass hover:bg-white/5'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center transition-all ${
                            isSelected ? 'border-white bg-white/20' : 'border-[#E3E1E2]/30'
                          }`}>
                            <div className={`w-5 h-5 rounded transition-all ${
                              isSelected ? 'bg-white' : 'bg-[#BB2228]'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-bold text-base">{tipo.nombre}</div>
                            <div className="text-sm opacity-90">S/ {tipo.precio.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, -1)}
                              className="w-8 h-8 border-2 border-white/80 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110"
                            >
                              <FiMinus size={14} />
                            </button>
                            <span className="w-10 text-center font-bold text-lg">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, 1)}
                              className="w-8 h-8 border-2 border-white/80 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BB2228] to-[#8B191E] text-white font-bold text-2xl hover:scale-110 transition-transform shadow-lg flex items-center justify-center"
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
              <h3 className="text-2xl font-bold mb-5 text-[#EFEFEE]">CONVENIOS</h3>
              <div className="grid grid-cols-2 gap-5">
                {tiposEntrada.convenios.map((tipo, index) => {
                  const entrada = entradas.find(e => e.id === tipo.id);
                  const isSelected = !!entrada;
                  
                  return (
                    <div key={tipo.id} 
                      className={`relative rounded-xl p-5 transition-all duration-300 transform hover:scale-105 animate-scale-in ${
                        isSelected ? 'btn-primary-gradient shadow-xl scale-105' : 'card-glass hover:bg-white/5'
                      }`}
                      style={{ animationDelay: `${(tiposEntrada.general.length + index) * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center transition-all ${
                            isSelected ? 'border-white bg-white/20' : 'border-[#E3E1E2]/30'
                          }`}>
                            <div className={`w-5 h-5 rounded transition-all ${
                              isSelected ? 'bg-white' : 'bg-[#BB2228]'
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-bold text-base">{tipo.nombre}</div>
                            <div className="text-sm opacity-90">S/ {tipo.precio.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, -1)}
                              className="w-8 h-8 border-2 border-white/80 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110"
                            >
                              <FiMinus size={14} />
                            </button>
                            <span className="w-10 text-center font-bold text-lg">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo.id, 1)}
                              className="w-8 h-8 border-2 border-white/80 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110"
                            >
                              <FiPlus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BB2228] to-[#8B191E] text-white font-bold text-2xl hover:scale-110 transition-transform shadow-lg flex items-center justify-center"
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

        {/* Panel lateral derecho - Resumen mejorado */}
        <div className="w-full lg:w-96 p-6 border-l border-white/5 animate-slide-up" style={{ background: 'linear-gradient(180deg, rgba(57, 58, 58, 0.3), rgba(57, 58, 58, 0.1))' }}>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
            RESUMEN
          </h3>
          
          {/* Información de la película */}
          {pelicula && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={pelicula.imagenCard} 
                  alt={pelicula.titulo ?? pelicula.title}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{(pelicula.titulo ?? pelicula.title ?? '').toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{format} - Doblada</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex-shrink-0 mt-0.5"></div>
              <div>
                <h5 className="font-medium text-sm">{selection?.cinemaName}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate(day || '')} - {time}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de entradas (vista detallada, no editable) */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Entradas</h4>
            {entradas && entradas.length > 0 ? (
              <div className="space-y-2">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{entrada.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Cantidad: {entrada.cantidad}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">S/ {entrada.precio.toFixed(2)}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Total: S/ {(entrada.precio * entrada.cantidad).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-xs text-gray-400">Cargo por servicio incluido</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No hay entradas seleccionadas.</div>
            )}

            {/* Totales */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>S/ {total.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>S/ {total.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <button
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
                entradas.length > 0 
                  ? 'btn-primary-gradient hover:scale-105' 
                  : 'btn-secondary-outline opacity-50 cursor-not-allowed'
              }`}
              disabled={entradas.length === 0}
              onClick={() => {
                if (entradas.length > 0 && showtimeId) {
                  localStorage.setItem('selectedEntradas', JSON.stringify(entradas));
                  const totalEntradas = entradas.reduce((sum, e) => sum + e.cantidad, 0);
                  navigate(`/butacas/${showtimeId}?total=${totalEntradas}`);
                }
              }}
            >
              CONTINUAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrito;
