import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideModal from '../components/SideModal';
import type { ConcessionProduct, ProductCategory } from '../types/ConcessionProduct';
import type { Cinema } from '../types/Cinema';
import { getProductsByCinema } from '../services/concessionService';
import { getAllCinemas } from '../services/cinemaService';
import { cinemaStorage } from '../utils/cinemaStorage';
import axios from 'axios';

type ProductsByCategory = {
  COMBOS: ConcessionProduct[];
  CANCHITA: ConcessionProduct[];
  BEBIDAS: ConcessionProduct[];
  SNACKS: ConcessionProduct[];
};

export default function Dulceria() {
  const navigate = useNavigate();
  const [selectedCine, setSelectedCine] = useState<Cinema | null>(null);
  const [productos, setProductos] = useState<ProductsByCategory | null>(null);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('COMBOS');
  const [showCineModal, setShowCineModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cines, setCines] = useState<Cinema[]>([]);
  const [loadingCines, setLoadingCines] = useState(true);

  const loadProductos = useCallback(async (cinema: Cinema) => {
    if (!cinema?.id) {
      console.warn('No se proporcionó un ID de cine válido');
      return;
    }

    console.log('Cargando productos para cine:', cinema.name, 'ID:', cinema.id);
    setLoadingProductos(true);
    setError(null);
    setProductos(null);
    
    try {
      // Obtenemos los productos asociados al cine específico a través de cinema_product
      const products = await getProductsByCinema(cinema.id);
      console.log('Productos recibidos:', products);
      
      const productsByCategory: ProductsByCategory = {
        COMBOS: [],
        CANCHITA: [],
        BEBIDAS: [],
        SNACKS: []
      };

      // Verificamos que los productos recibidos son válidos
      if (!Array.isArray(products)) {
        throw new Error('La respuesta del servidor no es un array válido');
      }

      // Organizamos los productos por categoría
      products.forEach(product => {
        const category = product.category;
        if (productsByCategory[category]) {
          productsByCategory[category].push(product);
        } else {
          console.warn('Categoría no reconocida:', category);
        }
      });

      setProductos(productsByCategory);
      setError(null);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      if (err instanceof Error) {
        console.error('Detalles del error:', err.message);
        if (axios.isAxiosError(err)) {
          console.error('Detalles de la respuesta:', err.response?.data);
          console.error('URL de la solicitud:', err.config?.url);
          console.error('Parámetros:', err.config?.params);
        }
      }
      setProductos(null);
      setError('Error al cargar los productos. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  const handleCineSelection = useCallback((cinema: Cinema) => {
    console.log('Seleccionando cine:', cinema.name, 'con ID:', cinema.id);
    setSelectedCine(cinema);
    // Guardamos la información completa del cine en localStorage
    cinemaStorage.save(cinema);
  }, []);

  const handleApply = () => {
    if (selectedCine) {
      setShowCineModal(false);
      // Recargar la página para que el Navbar se actualice
      window.location.reload();
    }
  };

  // Efecto para inicializar la carga de cines y productos
  useEffect(() => {
    const initializeCines = async () => {
      console.log('Iniciando carga de cines...');
      try {
        setLoadingCines(true);
        const data = await getAllCinemas();
        console.log('Cines recibidos:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log('No se recibieron cines');
          setError('No hay cines disponibles');
          setShowCineModal(true);
          return;
        }

        setCines(data);
        
        // Intentar recuperar el cine guardado
        let selectedCinema = null;
        const savedCine = cinemaStorage.load();
        
        if (savedCine) {
          // Verificar que el cine guardado existe en la lista actual
          selectedCinema = data.find(c => c.id === savedCine.id);
        }

        // Si no hay cine guardado o no se encontró en la lista, mostrar modal
        if (!selectedCinema) {
          setShowCineModal(true);
          return;
        }

        console.log('Cine seleccionado:', selectedCinema);
        setSelectedCine(selectedCinema);
        
        // Cargar los productos del cine seleccionado
        await loadProductos(selectedCinema);
        
      } catch (err) {
        console.error('Error detallado al cargar cines:', err);
        if (err instanceof Error) {
          console.error('Mensaje de error:', err.message);
          if (axios.isAxiosError(err)) {
            console.error('Detalles de la respuesta:', err.response?.data);
          }
        }
        setError('Error al cargar la lista de cines');
      } finally {
        setLoadingCines(false);
      }
    };

    initializeCines();
  }, [loadProductos]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCine = cinemaStorage.load();
      if (savedCine && cines.length > 0) {
        const cinema = cines.find(c => c.id === savedCine.id);
        if (cinema) {
          setSelectedCine(cinema);
          loadProductos(cinema);
        }
      }
    };

    // Ejecutar inmediatamente para sincronizar con localStorage
    handleStorageChange();
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadProductos, cines]);

  const handleAddToCart = (producto: ConcessionProduct) => {
    console.log('Agregado al carrito:', producto);
  };

  const categories = [
    { key: 'COMBOS' as ProductCategory, label: 'Combos', icon: '🍿' },
    { key: 'CANCHITA' as ProductCategory, label: 'Canchita', icon: '🍿' },
    { key: 'BEBIDAS' as ProductCategory, label: 'Bebidas', icon: '🥤' },
    { key: 'SNACKS' as ProductCategory, label: 'Snacks', icon: '🌭' }
  ];

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

        {error && (
          <div className="border px-4 py-3 rounded relative mb-6" style={{ backgroundColor: "#BB2228", borderColor: "#5C1214", color: "#EFEFEE" }} role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
        isOpen={showCineModal || !selectedCine} 
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