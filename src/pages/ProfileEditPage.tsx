import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useOrders from '../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ProfileEditPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  
  const navigate = useNavigate();
  const ordersQuery = useOrders();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
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

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'profile' 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'orders' 
                ? 'text-red-500 border-b-2 border-red-500' 
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
              <button type="submit" disabled={saving} className="w-full py-2 bg-red-700 rounded disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              {saved && <p className="text-green-400 text-sm">Guardado.</p>}
            </form>
            <div className="mt-8 text-sm text-neutral-400">Funciones adicionales (email, avatar) se agregarán en fases posteriores.</div>
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
                        className="px-4 py-2 bg-red-700 rounded hover:bg-red-600"
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