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
    <div style={{ background: "#141113", color: "#EFEFEE" }} className="min-h-screen pt-16">
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Dulcería</h1>
          {selectedCine && (
            <>
              <p className="text-xl mb-4">Productos disponibles en {selectedCine.name}</p>
              <img 
                src="https://i.imgur.com/STQ6A0v.png" 
                alt="Dulcería" 
                className="mx-auto cursor-pointer hover:opacity-80 transition-opacity"
onClick={() => setShowCineModal(true)}
              />
            </>
          )}
        </div>

        {/* error banner removed (not used) */}

        {!productos || loadingProductos ? (
          <>
            {/* Skeleton de categorías */}
            <div className="flex justify-center mb-8">
              {categories.map((_, index) => (
                <div key={index} className="mx-2 w-32 h-12 animate-pulse rounded" style={{ backgroundColor: "#393A3A" }}></div>
              ))}
            </div>

            {/* Skeleton de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="rounded-lg p-4 animate-pulse" style={{ backgroundColor: "#393A3A" }}>
                  <div className="w-full h-48 rounded-lg mb-4" style={{ backgroundColor: "#E3E1E2" }}></div>
                  <div className="h-6 rounded mb-2" style={{ backgroundColor: "#E3E1E2" }}></div>
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: "#E3E1E2" }}></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Tabs de categorías */}
            <div className="flex justify-center mb-8">
              {categories.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className="mx-2 px-6 py-3 rounded-lg transition duration-300 hover:brightness-75"
                  style={{
                    backgroundColor: activeCategory === key ? "#BB2228" : "#393A3A",
                    color: activeCategory === key ? "#EFEFEE" : "#E3E1E2"
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos[activeCategory].map((producto) => (
                <div
                  key={producto.id}
                  className="rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105"
                  style={{ backgroundColor: "#EFEFEE" }}
                >
                  <img
                    src={producto.imageUrl}
                    alt={producto.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold" style={{ color: "#141113" }}>{producto.name}</h3>
                    <p className="mt-2" style={{ color: "#393A3A" }}>{producto.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xl font-bold" style={{ color: "#141113" }}>
                        S/ {producto.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(producto)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition duration-300 cursor-pointer hover:brightness-75"
                        style={{ backgroundColor: "#E3E1E2", color: "#141113" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {productos[activeCategory].length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl" style={{ color: "#E3E1E2" }}>
                  No hay productos disponibles en esta categoría
                </p>
              </div>
            )}
          </>
        )}
      </div>

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