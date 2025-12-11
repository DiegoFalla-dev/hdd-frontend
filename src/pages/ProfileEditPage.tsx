import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useOrders from '../hooks/useOrders';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ProfileEditPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'fidelity'>('profile');
  
  const navigate = useNavigate();
  const ordersQuery = useOrders();
  const { user } = useAuth();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setTimeout(()=>{ setSaving(false); setSaved(true); }, 800);
  };

  const handleDownloadPDF = async (orderId: number) => {
    try {
      // Generar PDF simple de la orden
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;
      
      // Header
      pdf.setFillColor(25, 25, 112);
      pdf.rect(0, 0, pageWidth, 100, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CINEPLUS', margin, 50);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprobante de Compra', margin, 70);
      
      // Generar QR
      const qrDataUrl = await QRCode.toDataURL(`ORDER-${orderId}`);
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - 140, 20, 100, 100);
      
      // Información
      let y = 140;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Orden #${orderId}`, margin, y);
      
      y += 30;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Para más detalles, visita tu historial de compras.', margin, y);
      
      pdf.save(`orden_${orderId}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const handleViewDetails = (orderId: number) => {
    navigate(`/confirmacion?orderId=${orderId}`);
  };

  const fidelityPoints = user?.fidelityPoints || 0;
  const nextMilestone = Math.ceil(fidelityPoints / 100) * 100;
  const progressPercent = ((fidelityPoints % 100) / 100) * 100;

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('fidelity')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'fidelity' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mis Puntos 🎟️
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'orders' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mis Compras
          </button>
        </div>

        {/* Contenido de tabs */}
        {activeTab === 'profile' && (
          <div className="bg-neutral-900 rounded p-6">
            <h1 className="text-2xl font-bold mb-4">Editar Perfil</h1>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nombre</label>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full bg-neutral-800 px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Apellido</label>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full bg-neutral-800 px-3 py-2 rounded" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2 bg-orange-700 rounded disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              {saved && <p className="text-green-400 text-sm">Guardado.</p>}
            </form>
            <div className="mt-8 text-sm text-neutral-400">Funciones adicionales (email, avatar) se agregarán en fases posteriores.</div>
          </div>
        )}

        {/* Tab de Fidelización */}
        {activeTab === 'fidelity' && (
          <div className="bg-neutral-900 rounded p-6">
            <h1 className="text-2xl font-bold mb-6">Sistema de Fidelización CINEPLUS</h1>
            
            {/* Resumen de puntos */}
            <div className="bg-linear-to-r from-orange-900 to-orange-700 rounded-lg p-8 mb-8">
              <div className="text-center">
                <p className="text-orange-200 text-sm mb-2">Tus Puntos Acumulados</p>
                <p className="text-6xl font-bold text-white mb-2">{fidelityPoints}</p>
                <p className="text-orange-100">Puntos disponibles para usar</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Progreso hacia el siguiente nivel</h3>
              <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-linear-to-r from-orange-500 to-yellow-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{fidelityPoints % 100} de 100 puntos para alcanzar {nextMilestone} puntos</p>
            </div>

            {/* Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded p-4">
                <h4 className="font-semibold mb-2">¿Cómo funcionan los puntos?</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>✓ Ganas 1 punto por cada S/. 10 gastados</li>
                  <li>✓ Los puntos nunca expiran</li>
                  <li>✓ Úsalos para descuentos en futuras compras</li>
                  <li>✓ Acceso a ofertas exclusivas</li>
                </ul>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <h4 className="font-semibold mb-2">Beneficios por Nivel</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>🥉 0-100: Miembro Básico</li>
                  <li>🥈 101-250: Miembro Plata (5% descuento)</li>
                  <li>🥇 251+: Miembro Oro (10% descuento)</li>
                  <li>👑 500+: VIP (15% descuento + prioridad)</li>
                </ul>
              </div>
            </div>

            {user?.lastPurchaseDate && (
              <p className="text-sm text-gray-400 mt-6">
                Última compra: {new Date(user.lastPurchaseDate).toLocaleDateString('es-PE')}
              </p>
            )}
          </div>
        )}

        {/* Tab de Compras */}
        {activeTab === 'orders' && (
          <div className="bg-neutral-900 rounded p-6">
            {ordersQuery.isLoading && <p className="text-gray-400">Cargando compras...</p>}
            {ordersQuery.isError && <p className="text-red-500">Error al cargar compras</p>}
            {!ordersQuery.isLoading && !ordersQuery.isError && (!ordersQuery.data || ordersQuery.data.length === 0) && (
              <p className="text-gray-400">No tienes compras registradas</p>
            )}
            {ordersQuery.data && ordersQuery.data.length > 0 && (
              <div className="space-y-4">
                {ordersQuery.data.map((order: any) => (
                  <div key={order.id} className="bg-neutral-800 p-4 rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{order.movieTitle}</p>
                      <p className="text-sm text-gray-400">{new Date(order.purchaseDate).toLocaleDateString('es-PE')}</p>
                      <p className="text-sm text-gray-400">S/ {order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="space-x-2">
                      <button 
                        onClick={() => handleDownloadPDF(order.id)}
                        className="px-4 py-2 bg-orange-700 rounded hover:bg-orange-600"
                      >
                        PDF
                      </button>
                      <button 
                        onClick={() => handleViewDetails(order.id)}
                        className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProfileEditPage;