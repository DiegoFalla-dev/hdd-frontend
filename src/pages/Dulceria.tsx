import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideModal from '../components/SideModal';
import type { ConcessionProduct, ProductCategory } from '../types/ConcessionProduct';
import type { Cinema } from '../types/Cinema';
import { useConcessions } from '../hooks/useConcessions';
import { useCinemas } from '../hooks/useCinemas';
import { useShowtimeSelectionStore } from '../store/showtimeSelectionStore';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';

type ProductsByCategory = {
  COMBOS: ConcessionProduct[];
  CANCHITA: ConcessionProduct[];
  BEBIDAS: ConcessionProduct[];
  SNACKS: ConcessionProduct[];
};

export default function Dulceria() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const selection = useShowtimeSelectionStore(s => s.selection);
  const [selectedCine, setSelectedCine] = useState<Cinema | null>(null);
  const [productos, setProductos] = useState<ProductsByCategory | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('COMBOS');
  const [showCineModal, setShowCineModal] = useState(false);
  // error state removed (not used)
  const { data: cines = [], isLoading: loadingCines } = useCinemas();
  const { data: concessionProducts = [], isLoading: loadingProductos } = useConcessions(selectedCine?.id);

  // Agrupar productos por categoría cuando llegan
  useEffect(() => {
    if (!concessionProducts || concessionProducts.length === 0) {
      setProductos(null);
      return;
    }
    const grouped: ProductsByCategory = { COMBOS: [], CANCHITA: [], BEBIDAS: [], SNACKS: [] };
    concessionProducts.forEach(p => {
      if (grouped[p.category]) grouped[p.category].push(p); else console.warn('Categoría no reconocida:', p.category);
    });
    setProductos(grouped);
  }, [concessionProducts]);

  const handleCineSelection = useCallback((cinema: Cinema) => {
    setSelectedCine(cinema);
    // Ya no persistimos en localStorage (flujo migrado). Una futura acción podría actualizar store global de cines.
  }, []);

  const handleApply = () => {
    if (selectedCine) {
      setShowCineModal(false);
      // Cerrar modal y mantener selección sin recargar la página
      // Si otros componentes necesitan saber el cine, deberían leerlo del store
      // o de un contexto compartido. Evitamos reload para no entrar en bucle.
    }
  };

  // Efecto para inicializar la carga de cines y productos
  useEffect(() => {
    if (!cines || cines.length === 0) return;
    
    // Preferir cine del showtime selection (flujo de compra) si existe
    if (selection?.cinemaId) {
      const found = cines.find(c => c.id === selection.cinemaId);
      if (found) { setSelectedCine(found); return; }
    }
    
    // Si está logueado, intentar cargar cine guardado localmente
    if (user) {
      try {
        const savedCine = localStorage.getItem('selectedCine');
        if (savedCine) {
          const parsedCine = JSON.parse(savedCine);
          // Buscar cine por nombre
          const found = cines.find(c => c.name === parsedCine.name);
          if (found) { 
            setSelectedCine(found);
            return; 
          }
        }
      } catch (e) {
        console.warn('Error parsing saved cinema:', e);
      }
    }
    
    // Si no hay selección previa mostrar modal
    setShowCineModal(true);
  }, [cines, selection, user]);

  // Eliminado listener a localStorage; migración a store.

  const addConcession = useCartStore(s => s.addConcession);
  const handleAddToCart = (producto: ConcessionProduct) => {
    addConcession(producto, 1);
  };

  const categoryIcons: Record<ProductCategory, string> = {
    COMBOS: '🍿',
    CANCHITA: '🍿',
    BEBIDAS: '🥤',
    SNACKS: '🌭'
  };

  const categories = (productos ? Object.keys(productos) : ['COMBOS','CANCHITA','BEBIDAS','SNACKS'])
    .filter((c): c is ProductCategory => ['COMBOS','CANCHITA','BEBIDAS','SNACKS'].includes(c))
    .map(key => ({ key, label: key.charAt(0) + key.slice(1).toLowerCase(), icon: categoryIcons[key] }));

  return (
    <div className="min-h-screen pt-16 text-neutral-100" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        {/* Header premium con gradiente */}
        <div className="mb-8 pb-4 border-b border-white/5 animate-slide-up text-center">
          <h1 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent inline-block">
            🍿 Dulcería
          </h1>
          {selectedCine && (
            <>
              <p className="text-xl mb-6 text-neutral-400">Productos disponibles en <span className="font-semibold text-[#BB2228]">{selectedCine.name}</span></p>
              <img 
                src="https://i.imgur.com/STQ6A0v.png" 
                alt="Dulcería" 
                className="mx-auto cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-300 rounded-lg shadow-xl"
                onClick={() => setShowCineModal(true)}
              />
            </>
          )}
        </div>

        {/* Categorías glassmorphism */}
        {!productos || loadingProductos ? (
          <>
            <div className="flex justify-center mb-8 gap-4">
              {categories.map((_, index) => (
                <div key={index} className="card-glass w-32 h-14 animate-pulse rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="card-glass rounded-2xl p-4 animate-pulse">
                  <div className="w-full h-48 rounded-xl mb-4 bg-gradient-to-br from-[#393A3A] to-[#141113]"></div>
                  <div className="h-6 rounded-lg mb-3 bg-gradient-to-r from-[#393A3A] to-[#141113]"></div>
                  <div className="h-4 rounded-lg w-3/4 bg-gradient-to-r from-[#393A3A] to-[#141113]"></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-12 gap-3 flex-wrap">
              {categories.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                    activeCategory === key 
                      ? 'btn-primary-gradient shadow-lg' 
                      : 'card-glass hover:bg-white/5'
                  } animate-slide-up`}
                  style={{ animationDelay: '0.1s' }}
                >
                  <span className="mr-2 text-2xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {productos[activeCategory].map((producto, index) => (
                <div
                  key={producto.id}
                  className="card-glass rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden group">
                    <img
                      src={producto.imageUrl}
                      alt={producto.name}
                      className="w-full h-52 object-cover img-hover-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141113] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[#BB2228] transition-colors duration-300">{producto.name}</h3>
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-4">{producto.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="badge-gradient-red px-4 py-2 rounded-lg">
                        <span className="text-lg font-bold">S/ {producto.price.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(producto)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110 btn-primary-gradient shadow-lg"
                        title="Agregar al carrito"
                      >
                        +
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
                  <p className="text-xl text-neutral-400">
                    No hay productos disponibles en esta categoría
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <SideModal 
        isOpen={showCineModal} 
        onClose={() => navigate('/')}
        title="Seleccionar Cine"
      >
        {loadingCines ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="cinema-list">
              {cines.map((cinema) => (
                <div
                  key={cinema.id}
                  className={`cinema-item ${selectedCine?.id === cinema.id ? 'selected' : ''}`}
                  onClick={() => handleCineSelection(cinema)}
                >
                  <span className="cinema-name">{cinema.name}</span>
                </div>
              ))}
            </div>
            <div className="cinema-apply-container">
              <button 
                className="cinema-apply-btn" 
                onClick={handleApply}
                disabled={!selectedCine}
              >
                APLICAR
              </button>
            </div>
          </>
        )}
      </SideModal>
      <Footer />
    </div>
  );
}