import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useOrders } from '../hooks/useOrders';

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-600',
  PENDING: 'bg-yellow-600',
  FAILED: 'bg-red-600',
};

const OrdersPage: React.FC = () => {
  const { data, isLoading, error } = useOrders();

  return (
    <div style={{ background: '#141113', color: '#EFEFEE' }} className="min-h-screen pt-16">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Mis Compras</h1>
        {isLoading && <p>Cargando historial...</p>}
        {error && <p className="text-red-400">Error: {error.message}</p>}
        {!isLoading && !error && (!data || data.length === 0) && (
          <p className="text-gray-400">No tienes compras registradas todavía.</p>
        )}
        <div className="space-y-4">
          {(data || []).map(ord => {
            const badge = statusColor[ord.status || ''] || 'bg-gray-600';
            return (
              <Link
                key={ord.purchaseNumber || ord.id}
                to={`/confirmacion/${ord.purchaseNumber || ord.id}`}
                className="block border border-gray-700 rounded p-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">{ord.movieTitle || 'Película'}</h2>
                  <span className={`text-xs px-2 py-1 rounded ${badge}`}>{ord.status}</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Número:</strong> {ord.purchaseNumber || ord.id}</p>
                  <p><strong>Cine:</strong> {ord.cinemaName}</p>
                  <p><strong>Función:</strong> {ord.showDate} {ord.showTime} {ord.format}</p>
                  <p><strong>Total:</strong> S/ {ord.totalAmount?.toFixed(2)}</p>
                  <p><strong>Fecha compra:</strong> {ord.purchaseDate ? new Date(ord.purchaseDate).toLocaleString('es-PE') : '-'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;