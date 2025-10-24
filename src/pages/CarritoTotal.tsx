import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const CarritoTotal: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Aquí irá la lógica para cargar el resumen del carrito
        setLoading(false);
      } catch (error) {
        console.error('Error loading cart summary:', error);
      }
    };

    loadInitialData();
  }, []);

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
        <h1 className="text-xl font-bold">Resumen del Pedido</h1>
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
            <h2 className="text-2xl font-bold mb-6">Tu Pedido</h2>
            {/* Aquí irá el detalle del pedido */}
          </div>
        </div>

        {/* Panel lateral derecho - Pago */}
        <div className="w-80 p-6 border-l" style={{ borderColor: "var(--cineplus-gray-dark)", background: "var(--cineplus-gray-dark)" }}>
          <h3 className="text-lg font-bold mb-6">PAGO</h3>
          
          {/* Aquí irá el formulario de pago */}
          <button
            className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
            onClick={() => {/* Implementar lógica de pago */}}
          >
            PAGAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarritoTotal;
