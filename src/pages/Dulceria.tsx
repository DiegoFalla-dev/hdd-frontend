import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideModal from '../components/SideModal';
import type { ConcessionProduct, ProductCategory } from '../types/ConcessionProduct';
import type { Cinema } from '../types/Cinema';
import { getProductsByCinema } from '../services/concessionService';
import { getAllCinemas } from '../services/cinemaService';
import axios from 'axios';

type ProductsByCategory = {
  COMBOS: ConcessionProduct[];
  CANCHITA: ConcessionProduct[];
  BEBIDAS: ConcessionProduct[];
  SNACKS: ConcessionProduct[];
};

export default function Dulceria() {
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
    localStorage.setItem("selectedCine", JSON.stringify(cinema));
    setShowCineModal(false);
    // Cargamos los productos asociados a este cine
    loadProductos(cinema);
  }, [loadProductos]);

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
        const savedCineStr = localStorage.getItem("selectedCine");
        
        if (savedCineStr) {
          try {
            const savedCine = JSON.parse(savedCineStr);
            // Verificar que el cine guardado existe en la lista actual
            selectedCinema = data.find(c => c.id === savedCine.id);
          } catch (e) {
            console.error('Error parsing saved cinema:', e);
          }
        }

        // Si no hay cine guardado o no se encontró en la lista, usar el primero
        if (!selectedCinema) {
          selectedCinema = data[0];
          // Guardar el cine seleccionado por defecto
          localStorage.setItem("selectedCine", JSON.stringify(selectedCinema));
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
      const savedCineStr = localStorage.getItem("selectedCine");
      if (savedCineStr) {
        try {
          const savedCine = JSON.parse(savedCineStr);
          const cinema = cines.find(c => c.id === savedCine.id);
          if (cinema) {
            setSelectedCine(cinema);
            loadProductos(cinema);
          }
        } catch (e) {
          console.error('Error parsing saved cinema:', e);
        }
      }
    };

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
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Dulcería</h1>
          {selectedCine && (
            <>
              <p className="text-xl mb-4">Productos disponibles en {selectedCine.name}</p>
              <button
                onClick={() => setShowCineModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-300"
              >
                Cambiar cine
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!productos || loadingProductos ? (
          <>
            {/* Skeleton de categorías */}
            <div className="flex justify-center mb-8">
              {categories.map((_, index) => (
                <div key={index} className="mx-2 w-32 h-12 bg-gray-700 animate-pulse rounded"></div>
              ))}
            </div>

            {/* Skeleton de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
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
                  className={`mx-2 px-6 py-3 rounded-full transition duration-300 ${
                    activeCategory === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
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
                  className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105"
                >
                  <img
                    src={producto.imageUrl}
                    alt={producto.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900">{producto.name}</h3>
                    <p className="text-gray-600 mt-2">{producto.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">
                        S/ {producto.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(producto)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {productos[activeCategory].length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-400">
                  No hay productos disponibles en esta categoría
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <SideModal 
        isOpen={showCineModal} 
        onClose={() => setShowCineModal(false)}
        title="Elige tu cine"
      >
        <div className="grid grid-cols-1 gap-4">
          {loadingCines ? (
            <div className="text-center py-4">
              <p>Cargando cines...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-600">
              <p>{error}</p>
            </div>
          ) : cines.length === 0 ? (
            <div className="text-center py-4">
              <p>No hay cines disponibles</p>
            </div>
          ) : (
            cines.map((cine: Cinema) => (
              <button
                key={cine.id}
                onClick={() => handleCineSelection(cine)}
                className="w-full text-left px-4 py-3 rounded bg-gray-100 hover:bg-gray-200 transition duration-300"
              >
                {cine.name}
              </button>
            ))
          )}
        </div>
      </SideModal>

      <Footer />
    </div>
  );
}