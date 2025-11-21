import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { useShowtimeSelectionStore } from "../store/showtimeSelectionStore";
import { getProductsByCinema } from "../services/concessionService";
import { useSeatSelectionStore } from "../store/seatSelectionStore";
import { useCartStore } from "../store/cartStore";
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
  
  // legacy query params (not used currently)
  
  const totalEntradas = entradas.reduce((acc, e) => acc + e.precio * e.cantidad, 0);
  const totalProductos = cartConcessions.reduce((acc, c) => acc + c.unitPrice * c.quantity, 0);
  const totalGeneral = totalEntradas + totalProductos;

  useEffect(() => {
    const cineId = selection?.cinemaId || null;
    // Entradas: legacy aún en local hasta modelar tipos; mantener si existen
    const savedEntradas = localStorage.getItem("selectedEntradas");
    if (savedEntradas) setEntradas(JSON.parse(savedEntradas));
    // Asientos confirmados: usar seatSelectionStore si showtimeId presente
    if (selection?.showtimeId) {
      const sel = seatSelectionStore.selections[selection.showtimeId];
      if (sel?.reservedCodes) setSelectedSeats(sel.reservedCodes);
    }

    // Load concession products for the selected cinema
    (async () => {
      try {
        if (cineId) {
          const data = await getProductsByCinema(cineId);
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
        }
      } catch (err) {
        console.error('Error cargando productos de dulcería:', err);
        setProductos({ combos: [], canchita: [], bebidas: [], snacks: [] });
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
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: "var(--cineplus-gray-dark)" }}>
        <h1 className="text-xl font-bold">Alimentos y bebidas</h1>
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
          <div className="max-w-4xl mx-auto">
            {/* Banner de dulcería */}
            <div className="mb-8">
              <img 
                src="https://i.imgur.com/STQ6A0v.png" 
                alt="Banner Dulcería" 
                className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Tabs de categorías */}
            <div className="flex justify-center mb-8">
              <div className="flex border-b border-gray-600">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`px-8 py-3 font-semibold transition-all border-b-2 ${
                      activeCategory === category.key
                        ? 'border-red-600 text-white'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {productos[activeCategory].map((producto) => (
                <div key={producto.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                  <div className="h-48 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center relative">
                    <img src={producto.imagen || "/4x3.png"} alt={producto.nombre} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                      20%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-2 text-white">{producto.nombre.toUpperCase()}</h3>
                    <p className="text-xs text-gray-400 mb-3">{producto.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">S/ {producto.precio.toFixed(2)}</span>
                      <button
                        onClick={() => agregarProducto(producto)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {productos[activeCategory].length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-400">
                  No hay productos disponibles en esta categoría
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho - Resumen */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">RESUMEN</h3>
          
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
            <div 
              className="p-4 rounded flex items-center justify-between bg-white text-black cursor-pointer"
              onClick={() => {
                navigate('/pago');
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span className="font-bold">S/ {totalGeneral.toFixed(2)}</span>
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

export default CarritoDulceria;
