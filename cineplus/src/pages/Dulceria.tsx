import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import SideModal from "../components/SideModal";
import { getProductosByCine } from "../data/cinesDulceria";
import type { ProductoDulceria } from "../data/dulceria";

type ProductosPorCategoria = {
  combos: ProductoDulceria[];
  canchita: ProductoDulceria[];
  bebidas: ProductoDulceria[];
  snacks: ProductoDulceria[];
} | null;

export default function Dulceria() {
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [productos, setProductos] = useState<ProductosPorCategoria | null>(null);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'combos' | 'canchita' | 'bebidas' | 'snacks'>('combos');
  const [showCineModal, setShowCineModal] = useState(false);

  const cines = [
    "Cineplus Asia",
    "Cineplus Gamarra", 
    "Cineplus Jockey Plaza",
    "Cineplus Lambramani",
    "Cineplus Mall Ave Pza Arequipa",
    "Cineplus MallPlaza Angamos",
    "Cineplus Mallplaza Bellavista",
  ];

  const handleCineSelection = (cine: string) => {
    setSelectedCine(cine);
    localStorage.setItem("selectedCine", cine);
    setShowCineModal(false);
    setLoadingProductos(true);
    const p = getProductosByCine(cine);
    setProductos(p);
    setLoadingProductos(false);
  };

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    if (savedCine) {
      setSelectedCine(savedCine);
      setLoadingProductos(true);
      const p = getProductosByCine(savedCine);
      setProductos(p);
      setLoadingProductos(false);
    } else {
      setShowCineModal(true);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = async () => {
        const savedCine = localStorage.getItem("selectedCine");
        if (savedCine) {
          setSelectedCine(savedCine);
          setLoadingProductos(true);
          const p = getProductosByCine(savedCine);
          setProductos(p);
          setLoadingProductos(false);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAddToCart = (producto: ProductoDulceria) => {
    console.log('Agregado al carrito:', producto);
  };

  const categories = [
    { key: 'combos' as const, label: 'Combos', icon: '🍿' },
    { key: 'canchita' as const, label: 'Canchita', icon: '🍿' },
    { key: 'bebidas' as const, label: 'Bebidas', icon: '🥤' },
    { key: 'snacks' as const, label: 'Snacks', icon: '🌭' }
  ];

  return (
    <div style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }} className="min-h-screen pt-16">
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Dulcería</h1>
          {selectedCine && (
            <>
              <p className="text-lg mb-4" style={{ color: "var(--cineplus-gray)" }}>
                {selectedCine}
              </p>
              <div className="mb-8">
                <img 
                  src="ConfieriaImagen.png" 
                  alt="Banner Dulcería" 
                  className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            </>
          )}
        </div>

        {!productos || loadingProductos ? (
          <>
            {/* Skeleton de categorías */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-gray-800 rounded-lg p-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="px-6 py-3 rounded-md">
                    <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-700"></div>
                  <div className="p-4">
                    <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="w-full h-4 bg-gray-700 rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-6 bg-gray-700 rounded"></div>
                      <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SideModal 
              isOpen={showCineModal} 
              onClose={() => {}}
              title="Elige tu cine"
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--cineplus-gray)" }}>Selecciona tu cine favorito</h3>
                <p className="text-xs mb-4" style={{ color: "var(--cineplus-gray)" }}>Ordenado alfabéticamente</p>
              </div>

              <div className="space-y-3">
                {cines.map((cine) => (
                  <div 
                    key={cine}
                    onClick={() => handleCineSelection(cine)}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800"
                    style={{ 
                      backgroundColor: selectedCine === cine ? "var(--cineplus-gray-dark)" : "transparent",
                      border: `1px solid ${selectedCine === cine ? "var(--cineplus-gray)" : "var(--cineplus-gray-dark)"}` 
                    }}
                  >
                    <div>
                      <h4 className="font-medium" style={{ color: "var(--cineplus-gray-light)" }}>{cine}</h4>
                      <p className="text-xs" style={{ color: "var(--cineplus-gray)" }}>2D</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2" style={{ 
                      borderColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "var(--cineplus-gray)",
                      backgroundColor: selectedCine === cine ? "var(--cineplus-gray-light)" : "transparent"
                    }} />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowCineModal(false)}
                className="w-full mt-6 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                APLICAR
              </button>
            </SideModal>
          </>
        ) : (
          <>
            {/* Tabs de categorías */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-gray-800 rounded-lg p-1">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`px-6 py-3 rounded-md font-semibold transition-all ${
                      activeCategory === category.key
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos[activeCategory].map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {productos[activeCategory].length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: "var(--cineplus-gray)" }}>
                  No hay productos disponibles en esta categoría
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}