import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProductosByCine } from "../data/cinesDulceria";

interface ProductoDulceria {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  categoria: 'combos' | 'canchita' | 'bebidas' | 'snacks';
}

export default function Dulceria() {
  const [selectedCine, setSelectedCine] = useState<string | null>(null);
  const [productos, setProductos] = useState<{
    combos: ProductoDulceria[];
    canchita: ProductoDulceria[];
    bebidas: ProductoDulceria[];
    snacks: ProductoDulceria[];
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState<'combos' | 'canchita' | 'bebidas' | 'snacks'>('combos');

  useEffect(() => {
    const savedCine = localStorage.getItem("selectedCine");
    if (savedCine) {
      setSelectedCine(savedCine);
      const productosDelCine = getProductosByCine(savedCine);
      setProductos(productosDelCine);
    } else {
      const timer = setTimeout(() => {
        const elegirCineButton = document.querySelector('button[data-elegir-cine]') as HTMLButtonElement;
        if (elegirCineButton) {
          elegirCineButton.click();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCine = localStorage.getItem("selectedCine");
      if (savedCine) {
        setSelectedCine(savedCine);
        const productosDelCine = getProductosByCine(savedCine);
        setProductos(productosDelCine);
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
                  src="https://sacnkprodpecms.blob.core.windows.net/content/banners/candy/1756237860453-large-2304X800-cierre.webp" 
                  alt="Banner Dulcería" 
                  className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            </>
          )}
        </div>

        {!productos ? (
          <div className="text-center py-12">
            <p className="text-xl">Selecciona un cine para ver los productos disponibles</p>
          </div>
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