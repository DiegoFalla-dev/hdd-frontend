import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiMinus, FiPlus } from "react-icons/fi";
import { getMovieSelection, getSelectedCine } from "../utils/storage";
import { promotionService } from "../services/promotionService";
import type { Promotion } from "../types/Promotion";

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: 'GENERAL' | 'CONVENIO';
  maxPorUsuario?: number;
}

interface TiposEntrada {
  general: Entrada[];
  convenios: Entrada[];
}

const CarritoEntradas: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [movieSelection, setMovieSelection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCuponModal, setShowCuponModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promocionAplicada, setPromocionAplicada] = useState<Promotion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tiposEntrada: TiposEntrada = {
    general: [
      { id: 'promo-online', nombre: 'PROMO ONLINE', precio: 14.96, cantidad: 0, tipo: 'GENERAL' },
      { id: 'persona-discapacidad', nombre: 'PERSONA CON DISCAPACIDAD', precio: 17.70, cantidad: 0, tipo: 'GENERAL', maxPorUsuario: 1 },
      { id: 'silla-ruedas', nombre: 'SILLA DE RUEDAS', precio: 17.70, cantidad: 0, tipo: 'GENERAL', maxPorUsuario: 1 },
      { id: 'nino', nombre: 'NIÑO', precio: 21.60, cantidad: 0, tipo: 'GENERAL' },
      { id: 'adulto', nombre: 'ADULTO', precio: 23.60, cantidad: 0, tipo: 'GENERAL' }
    ],
    convenios: [
      { id: 'banco-ripley', nombre: '50% DCTO BANCO RIPLEY', precio: 12.80, cantidad: 0, tipo: 'CONVENIO', maxPorUsuario: 2 }
    ]
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const selection = getMovieSelection();
        if (!selection) {
          throw new Error('No se ha seleccionado una película');
        }
        setMovieSelection(selection);

        const cine = getSelectedCine();
        if (cine) setSelectedCine(cine.name);

        // Recuperar entradas guardadas si existen
        const savedEntradas = localStorage.getItem('selectedEntradas');
        if (savedEntradas) {
          setEntradas(JSON.parse(savedEntradas));
        }

        // Recuperar promoción si existe
        const savedPromocion = localStorage.getItem('selectedPromocion');
        if (savedPromocion) {
          setPromocionAplicada(JSON.parse(savedPromocion));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const verificarLimites = (entrada: Entrada, delta: number): boolean => {
    if (!entrada.maxPorUsuario) return true;
    
    const cantidadActual = entradas.find(e => e.id === entrada.id)?.cantidad || 0;
    return cantidadActual + delta <= entrada.maxPorUsuario;
  };

  const agregarEntrada = (tipo: Entrada) => {
    if (!verificarLimites(tipo, 1)) {
      setError(`Has alcanzado el límite máximo para ${tipo.nombre}`);
      return;
    }

    setError(null);
    const existente = entradas.find(e => e.id === tipo.id);
    if (existente) {
      setEntradas(entradas.map(e => 
        e.id === tipo.id ? { ...e, cantidad: e.cantidad + 1 } : e
      ));
    } else {
      setEntradas([...entradas, { ...tipo, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (entrada: Entrada, delta: number) => {
    if (delta > 0 && !verificarLimites(entrada, delta)) {
      setError(`Has alcanzado el límite máximo para ${entrada.nombre}`);
      return;
    }

    setError(null);
    setEntradas(entradas.map(e => {
      if (e.id === entrada.id) {
        const nuevaCantidad = e.cantidad + delta;
        return { ...e, cantidad: nuevaCantidad };
      }
      return e;
    }).filter(e => e.cantidad > 0));
  };

  const subtotal = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);
  const serviceFee = subtotal * 0.05; // 5% cargo por servicio
  const descuento = promocionAplicada ? 
    (promocionAplicada.discountType === 'PERCENTAGE' ? 
      subtotal * (promocionAplicada.value / 100) : 
      promocionAplicada.value) : 0;
  const total = subtotal + serviceFee - descuento;

  const handleAplicarCupon = async () => {
    try {
      setError(null);
      if (!promoCode.trim()) {
        setError('Ingrese un código de promoción');
        return;
      }

      const promocion = await promotionService.getByCode(promoCode);
      if (!promocion) {
        setError('Código de promoción inválido');
        return;
      }

      // Validar la promoción
      if (subtotal < promocion.minAmount) {
        setError(`El monto mínimo para esta promoción es S/ ${promocion.minAmount}`);
        return;
      }

      setPromocionAplicada(promocion);
      localStorage.setItem('selectedPromocion', JSON.stringify(promocion));
      setShowCuponModal(false);
    } catch (error) {
      console.error('Error applying promotion:', error);
      setError('Error al aplicar la promoción');
    }
  };

  const handleContinuar = () => {
    if (entradas.length === 0) {
      setError('Seleccione al menos una entrada');
      return;
    }

    // Guardar selección
    localStorage.setItem('selectedEntradas', JSON.stringify(entradas));
    
    // Navegar a butacas
    navigate('/butacas');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Entradas</h1>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex">
        {/* Contenido principal */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">ELIJA SUS ENTRADAS</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}
            
            {/* Botón cupón */}
            <button 
              onClick={() => setShowCuponModal(true)}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold mb-8 hover:bg-gray-100 transition-colors"
            >
              TENGO UN CUPÓN
            </button>

            {promocionAplicada && (
              <div className="mb-8 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500 flex justify-between items-center">
                <div>
                  <p className="font-bold">{promocionAplicada.code}</p>
                  <p className="text-sm">{promocionAplicada.description}</p>
                </div>
                <button
                  onClick={() => {
                    setPromocionAplicada(null);
                    localStorage.removeItem('selectedPromocion');
                  }}
                  className="text-green-500 hover:text-green-400"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}

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
                            {tipo.maxPorUsuario && (
                              <div className="text-xs text-gray-500">
                                Máximo {tipo.maxPorUsuario} por usuario
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => cambiarCantidad(tipo, -1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo, 1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="text-2xl font-bold hover:opacity-75"
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
                            {tipo.maxPorUsuario && (
                              <div className="text-xs text-gray-500">
                                Máximo {tipo.maxPorUsuario} por usuario
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => cambiarCantidad(tipo, -1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center">{entrada?.cantidad}</span>
                            <button 
                              onClick={() => cambiarCantidad(tipo, 1)}
                              className="w-6 h-6 border border-current rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => agregarEntrada(tipo)}
                            className="text-2xl font-bold hover:opacity-75"
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
          {movieSelection?.pelicula && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <img 
                  src={movieSelection.pelicula.imagenCard} 
                  alt={movieSelection.pelicula.titulo}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h5 className="font-medium text-sm">{movieSelection.pelicula.titulo.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                    {movieSelection.selectedFormat} - {movieSelection.pelicula.idioma || 'Doblada'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información del cine y horario */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Cine, día y horario</h4>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded shrink-0 mt-1"></div>
              <div>
                <h5 className="font-medium text-sm">{selectedCine}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {movieSelection?.selectedTheater ? `Sala ${movieSelection.selectedTheater}` : 'Sala por asignar'}
                </p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate(movieSelection?.selectedDay || '')} - {movieSelection?.selectedTime}
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
                        <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                          S/ {(entrada.precio * entrada.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => cambiarCantidad(entrada, -1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{entrada.cantidad}</span>
                      <button 
                        onClick={() => cambiarCantidad(entrada, 1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desglose de precios */}
              <div className="mt-4 pt-4 border-t border-gray-600 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Cargo por servicio online (5%)</span>
                  <span>S/ {serviceFee.toFixed(2)}</span>
                </div>

                {promocionAplicada && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Descuento {promocionAplicada.code}</span>
                    <span>- S/ {descuento.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <button 
              className={`w-full p-4 rounded flex items-center justify-between transition-colors ${
                entradas.length > 0 
                  ? 'bg-white text-black hover:bg-gray-100' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleContinuar}
              disabled={entradas.length === 0}
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
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cupón */}
      {showCuponModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Aplicar Cupón</h3>
              <button onClick={() => setShowCuponModal(false)}>
                <FiX size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Ingrese código de cupón"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />

            <button
              onClick={handleAplicarCupon}
              className="w-full bg-black text-white py-2 rounded font-bold hover:bg-gray-900"
            >
              APLICAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoEntradas;
