import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useOrders } from '../hooks/useOrders';

const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
  COMPLETED: { color: 'bg-green-600', label: 'Completado', icon: '✓' },
  PENDING: { color: 'bg-yellow-600', label: 'Pendiente', icon: '⏳' },
  FAILED: { color: 'bg-red-600', label: 'Fallido', icon: '✕' },
  CANCELLED: { color: 'bg-red-700', label: 'Cancelado', icon: '⊘' },
  REFUNDED: { color: 'bg-blue-600', label: 'Reembolsado', icon: '↺' },
};

const OrdersPage: React.FC = () => {
  const { data, isLoading, error } = useOrders();

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { color: 'bg-gray-600', label: status, icon: '?' };
  };

  const formatPrice = (amount: number | undefined) => {
    if (!amount) return 'S/ 0.00';
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ background: '#141113', color: '#EFEFEE' }} className="min-h-screen flex flex-col pt-16">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mis Compras</h1>
          <p className="text-gray-400">Historial de tus entradas y pedidos</p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="ml-4 text-gray-400">Cargando historial...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-300">❌ Error al cargar compras: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">🍿 No tienes compras registradas todavía.</p>
            <p className="text-gray-500">Realiza tu primera compra para verla aquí.</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="grid gap-4">
            {data.map(order => {
              const statusConfig = getStatusConfig(order.status || 'PENDING');
              const ticketCount = order.orderItems?.length || 0;
              const concessionCount = order.orderConcessions?.length || 0;
              
              return (
                <Link
                  key={order.purchaseNumber || order.id}
                  to={`/confirmacion/${order.purchaseNumber || order.id}`}
                  className="group block border border-gray-700 rounded-lg p-5 hover:border-orange-500 hover:bg-gray-900 transition-all duration-300 transform hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-white group-hover:text-orange-400 transition">
                          {order.movieTitle || 'Película'}
                        </h2>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {order.cinemaName && order.roomName && (
                          <>
                            📍 {order.cinemaName} • Sala {order.roomName}
                          </>
                        )}
                      </p>
                    </div>
                    <div className={`text-xs px-3 py-2 rounded font-semibold ${statusConfig.color} text-white whitespace-nowrap ml-4`}>
                      {statusConfig.icon} {statusConfig.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">N° Orden</p>
                      <p className="text-white font-mono">{order.purchaseNumber || `#${order.id}`}</p>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Fecha</p>
                      <p className="text-white">{formatDate(order.purchaseDate)}</p>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <p className="text-gray-400 text-xs mb-1">Formato</p>
                      <p className="text-white">{order.format || '-'}</p>
                    </div>
                    <div className="bg-orange-900 rounded p-3">
                      <p className="text-orange-300 text-xs mb-1">Total</p>
                      <p className="text-orange-100 font-bold text-lg">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>

                  {(ticketCount > 0 || concessionCount > 0) && (
                    <div className="flex gap-4 pt-3 border-t border-gray-700 text-xs">
                      {ticketCount > 0 && (
                        <span className="text-gray-400">
                          🎫 {ticketCount} entrada{ticketCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {concessionCount > 0 && (
                        <span className="text-gray-400">
                          🍿 {concessionCount} concesión{concessionCount !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition">
                    Ver detalles y descargar tickets →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;