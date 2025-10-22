import React from "react";
import { Plus } from "react-feather";
import type { ProductoDulceria } from "../data/dulceria";

interface ProductCardProps {
  producto: ProductoDulceria;
  onAddToCart?: (producto: ProductoDulceria) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ producto, onAddToCart }) => {
  if (!producto) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-80 bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl">🍿</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{producto.nombre || 'Sin nombre'}</h3>
        <p className="text-gray-600 text-sm mb-3">{producto.descripcion || 'Sin descripción'}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">S/ {(producto.precio || 0).toFixed(2)}</span>
          <button
            onClick={() => onAddToCart?.(producto)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;