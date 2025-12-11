import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { useShowtimeSelectionStore } from "../store/showtimeSelectionStore";
import { getProductsByCinema } from "../services/concessionService";
import { useToast } from '../components/ToastProvider';
import { useSeatSelectionStore } from "../store/seatSelectionStore";
import { useCartStore } from "../store/cartStore";
import seatService from '../services/seatService';
import type { ConcessionProduct } from "../types/ConcessionProduct";

interface Entrada {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface ProductoDulceria {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  categoria: 'combos' | 'canchita' | 'bebidas' | 'snacks';
}


const CarritoDulceria: React.FC = () => {
  // legacy query params not used
  const navigate = useNavigate();
  const selection = useShowtimeSelectionStore(s => s.selection);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const seatSelectionStore = useSeatSelectionStore();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [productos, setProductos] = useState<{
    combos: ProductoDulceria[];
    canchita: ProductoDulceria[];
    bebidas: ProductoDulceria[];
    snacks: ProductoDulceria[];
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState<'combos' | 'canchita' | 'bebidas' | 'snacks'>('combos');
  const cartConcessions = useCartStore(s => s.concessions);
  const addConcession = useCartStore(s => s.addConcession);
  const updateConcession = useCartStore(s => s.updateConcession);
  const clearCart = useCartStore(s => s.clearCart);
  const setTicketGroup = useCartStore(s => s.setTicketGroup);
  
  // legacy query params (not used currently)
  const toast = useToast();
  
  const totalEntradas = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);
  const totalProductos = cartConcessions.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);
  const totalGeneral = totalEntradas + totalProductos;

  useEffect(() => {
    const cineId = selection?.cinemaId || null;
    // Entradas: legacy aún en local hasta modelar tipos; mantener si existen
    const savedEntradas = localStorage.getItem("selectedEntradas");
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas));

    // Try to read pendingOrder early so we can enrich it after loading products
    const raw = localStorage.getItem('pendingOrder');
    let pendingRaw: any = null;
    if (raw) {
      try {
        pendingRaw = JSON.parse(raw);
      } catch (e) {
        console.error('Invalid pendingOrder in localStorage', e);
        pendingRaw = null;
      }
    }

    // Load concession products for the selected cinema and then enrich pendingOrder if present
    (async () => {
      try {
        let data: ConcessionProduct[] = [];
        if (cineId) {
          data = await getProductsByCinema(cineId);
          // Map ConcessionProduct to our ProductoDulceria grouping
          const grouped = {
            combos: [] as ProductoDulceria[],
            canchita: [] as ProductoDulceria[],
            bebidas: [] as ProductoDulceria[],
            snacks: [] as ProductoDulceria[],
          };

          data.forEach((p: ConcessionProduct) => {
            const mapped: ProductoDulceria = {
              id: String(p.id),
              nombre: p.name,
              descripcion: p.description,
              precio: p.price,
              imagen: p.imageUrl,
              categoria: p.category.toLowerCase() as any
            };

            const key = mapped.categoria;
            if (key === 'combos' || key === 'canchita' || key === 'bebidas' || key === 'snacks') {
              (grouped as any)[key].push(mapped);
            }
          });

          setProductos(grouped);
        } else {
          setProductos({ combos: [], canchita: [], bebidas: [], snacks: [] });
        }

        // If there was a pendingOrder, try to enrich its concessions with fetched product data
        if (pendingRaw) {
          try {
              if (pendingRaw.concessions && Array.isArray(pendingRaw.concessions) && pendingRaw.concessions.length) {
              const prodMap = new Map<number, ConcessionProduct>();
              data.forEach(p => prodMap.set(p.id, p));

              const enriched = pendingRaw.concessions.map((c: any) => {
                const prod = prodMap.get(Number(c.productId));
                if (prod) {
                  return {
                    productId: prod.id,
                    name: prod.name,
                    unitPrice: prod.price,
                    description: prod.description,
                    imageUrl: prod.imageUrl,
                    quantity: c.quantity
                  };
                }
                // fallback to minimal
                return {
                  productId: c.productId,
                  name: c.name || 'Producto',
                  unitPrice: c.unitPrice || c.price || 0,
                  description: c.description || '',
                  imageUrl: '',
                  quantity: c.quantity
                };
              });
              pendingRaw.concessions = enriched;
              try { localStorage.setItem('pendingOrder', JSON.stringify(pendingRaw)); toast.info('Concesiones enriquecidas y guardadas en el pedido'); } catch (e) { /* ignore */ }
            }
          } catch (e) {
            // ignore enrichment errors, keep using pendingRaw as-is
            console.warn('Could not enrich pendingOrder concessions', e);
          }

          // Hydrate UI state from pending
          setSelectedSeats(pendingRaw.seats || []);
          const savedEntradasFromPending = pendingRaw.entradas || JSON.parse(localStorage.getItem('selectedEntradas') || '[]');
          if (savedEntradasFromPending) setEntradas(savedEntradasFromPending);
          // Asegurar que el carrito de pago tenga el grupo de tickets
          if (pendingRaw.showtimeId && pendingRaw.seats && pendingRaw.seats.length) {
            // Calcular el total real de las entradas: suma de precio × cantidad
            const totalFromEntradas = savedEntradasFromPending.reduce((sum: number, e: any) => sum + (e.precio * e.cantidad), 0);
            setTicketGroup(pendingRaw.showtimeId, pendingRaw.seats, pendingRaw.pricePerSeat || 0, totalFromEntradas);
          }
        } else {
          // fallback: Asientos confirmados: usar seatSelectionStore si showtimeId presente
          if (selection?.showtimeId) {
            const sel = seatSelectionStore.selections[selection.showtimeId];
            if (sel?.reservedCodes) setSelectedSeats(sel.reservedCodes);
          }
        }

      } catch (err) {
        console.error('Error cargando productos de dulcería o enriqueciendo pendingOrder:', err);
        setProductos({ combos: [], canchita: [], bebidas: [], snacks: [] });
        // If enrichment failed but there is pendingRaw, fallback to minimal hydration
        if (pendingRaw) {
          try {
            setSelectedSeats(pendingRaw.seats || []);
            const savedEntradasFromPending = pendingRaw.entradas || JSON.parse(localStorage.getItem('selectedEntradas') || '[]');
            if (savedEntradasFromPending) setEntradas(savedEntradasFromPending);
            if (pendingRaw.showtimeId && pendingRaw.seats && pendingRaw.seats.length) {
              // Calcular el total real de las entradas
              const totalFromEntradas = savedEntradasFromPending.reduce((sum: number, e: any) => sum + (e.precio * e.cantidad), 0);
              setTicketGroup(pendingRaw.showtimeId, pendingRaw.seats, pendingRaw.pricePerSeat || 0, totalFromEntradas);
            }
          } catch (e) { /* swallow */ }
        }
      }
    })();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[date.getDay()];
    const dayMonth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${dayName}, ${dayMonth}`;
  };

  const agregarProducto = (producto: ProductoDulceria) => {
    // Adaptar a CartStore concesiones
    addConcession({ id: Number(producto.id), name: producto.nombre, price: producto.precio, description: producto.descripcion, imageUrl: producto.imagen || '', category: producto.categoria.toUpperCase() as any });
  };

  const cambiarCantidadProducto = (id: string, delta: number) => {
    const concesion = cartConcessions.find(c => String(c.productId) === id);
    if (!concesion) return;
    const nuevaCantidad = concesion.quantity + delta;
    updateConcession(concesion.productId, nuevaCantidad);
  };

  const categories = [
    { key: 'combos' as const, label: 'COMBOS' },
    { key: 'canchita' as const, label: 'CANCHITA' },
    { key: 'bebidas' as const, label: 'BEBIDAS' },
    { key: 'snacks' as const, label: 'SNACKS' }
  ];

  if (!productos) {
    return (
      <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
          <h1 className="text-xl font-bold">Alimentos y bebidas</h1>
          <button className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-8 text-center">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)", color: "var(--cineplus-gray-light)" }} className="min-h-screen animate-fade-in">
      {/* Header */}
      {/* Header mejorado */}
      <div className="flex justify-between items-center p-6 border-b border-white/5 backdrop-blur-sm" style={{ background: 'rgba(57, 58, 58, 0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></div>
          <h1 className="text-2xl font-black">Selección de Dulcería</h1>
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
          <div className="max-w-4xl mx-auto animate-slide-up">

            {/* Tabs de categorías */}
            <div className="flex justify-center mb-10">
              <div className="card-glass flex rounded-xl p-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`px-8 py-3 font-bold text-sm transition-all duration-300 rounded-lg ${
                      activeCategory === category.key
                        ? 'btn-primary-gradient shadow-lg scale-105'
                        : 'text-[#E3E1E2]/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {productos[activeCategory].map((producto, index) => (
                <div key={producto.id} 
                  className="card-glass rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-48 relative overflow-hidden group">
                    <img src={producto.imagen || "/4x3.png"} alt={producto.nombre} className="w-full h-full object-cover img-hover-zoom" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141113] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-3 left-3 badge-gradient-red px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
                      20% OFF
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-2 text-white line-clamp-1">{producto.nombre.toUpperCase()}</h3>
                    <p className="text-xs text-[#E3E1E2]/70 mb-3 line-clamp-2">{producto.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">S/ {producto.precio.toFixed(2)}</span>
                      <button
                        onClick={() => agregarProducto(producto)}
                        className="bg-gradient-to-br from-[#BB2228] to-[#8B191E] hover:scale-110 text-white p-2 rounded-xl transition-transform shadow-lg"
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {productos[activeCategory].length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="card-glass inline-block p-8 rounded-2xl">
                  <div className="text-6xl mb-4 opacity-50">🍿</div>
                  <p className="text-lg text-[#E3E1E2]">
                    No hay productos disponibles en esta categoría
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho - Resumen mejorado */}
        <div className="w-full lg:w-96 p-6 border-l border-white/5 animate-slide-up" style={{ background: 'linear-gradient(180deg, rgba(57, 58, 58, 0.3), rgba(57, 58, 58, 0.1))' }}>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
            RESUMEN
          </h3>
          
          {/* Información de la película */}
          {selection?.movieTitle && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Película</h4>
              <div className="flex gap-3">
                <div className="w-12 h-16 bg-gray-700 flex items-center justify-center rounded text-xs">Poster</div>
                <div>
                  <h5 className="font-medium text-sm">{selection.movieTitle.toUpperCase()}</h5>
                  <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>{selection.format} - Doblada</p>
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
                <h5 className="font-medium text-sm">{selection?.cinemaName}</h5>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Sala 6</p>
                <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>
                  {formatDate(selection?.date || '')} - {selection?.time}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de entradas */}
          {entradas.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Entradas</h4>
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div key={entrada.id} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded"></div>
                    <div>
                      <div className="text-sm font-medium">{entrada.cantidad} - {entrada.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {entrada.precio.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asientos seleccionados */}
          {selectedSeats.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Asientos</h4>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div>
                  <div className="text-sm font-medium">{selectedSeats.join(', ')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Productos de dulcería */}
          {cartConcessions.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Alimentos y bebidas</h4>
              <div className="space-y-3">
                {cartConcessions.map((producto) => (
                  <div key={producto.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <div>
                        <div className="text-sm font-medium">{producto.quantity} - {producto.name}</div>
                        <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>S/ {producto.unitPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => cambiarCantidadProducto(String(producto.productId), -1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{producto.quantity}</span>
                      <button 
                        onClick={() => cambiarCantidadProducto(String(producto.productId), 1)}
                        className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cargo por servicio */}
          <div className="mb-6 pt-4 border-t border-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium">Cargo por servicio online</div>
                <div className="text-xs" style={{ color: "var(--cineplus-gray)" }}>Incluye el cargo por servicio online</div>
              </div>
            </div>
          </div>

          {/* Total y botón continuar */}
          <div className="mt-auto">
            <div className="space-y-4">
              <div className="card-glass p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center">
                      <span className="text-white text-xs">💰</span>
                    </div>
                    <span className="font-bold text-2xl text-white">S/ {totalGeneral.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 btn-primary-gradient py-4 rounded-xl font-bold text-base hover:scale-105 transition-transform shadow-lg"
                    onClick={() => {
                      navigate('/pago');
                    }}
                  >
                    💳 PAGAR
                  </button>
                  <button
                    className="flex-1 btn-secondary-outline py-4 rounded-xl font-bold text-base hover:scale-105 transition-transform"
                    onClick={async () => {
                      const raw = localStorage.getItem('pendingOrder');
                      if (raw) {
                        try {
                          const pending = JSON.parse(raw);
                          if (pending?.showtimeId && pending?.seats && pending.seats.length) {
                            try {
                              await seatService.releaseTemporarySeats(pending.showtimeId, pending.seats);
                            } catch (e) {
                              // ignore release errors
                            }
                            seatSelectionStore.clearShowtime(pending.showtimeId);
                          }
                        } catch {}
                      }
                      clearCart();
                      localStorage.removeItem('pendingOrder');
                      navigate(selection?.movieId ? `/detalle-pelicula?pelicula=${selection.movieId}` : '/');
                    }}
                  >
                    ❌ CANCELAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarritoDulceria;
