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
    <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }} className="min-h-screen text-white pt-16">
      <Navbar />
      <main className="max-w-6xl mx-auto p-8 animate-fade-in">
        {/* Header mejorado */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent mb-2">Mi Perfil</h1>
          <p className="text-[#E3E1E2]/70 text-sm">Gestiona tu cuenta, visualiza tus compras y puntos de fidelización</p>
        </div>

        {/* Tabs con diseño mejorado */}
        <div className="flex gap-2 mb-8 backdrop-blur-sm rounded-xl p-1" style={{ background: 'rgba(57, 58, 58, 0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'btn-primary-gradient shadow-lg' 
                : 'text-[#E3E1E2]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            👤 Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('fidelity')}
            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === 'fidelity' 
                ? 'btn-primary-gradient shadow-lg' 
                : 'text-[#E3E1E2]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            ⭐ Mis Puntos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === 'orders' 
                ? 'btn-primary-gradient shadow-lg' 
                : 'text-[#E3E1E2]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🎫 Mis Compras
          </button>
        </div>

        {/* Contenido de tabs */}
        {activeTab === 'profile' && (
          <div className="card-glass rounded-2xl p-8 animate-slide-up">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
              Editar Perfil
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-3 text-[#E3E1E2]">Nombre</label>
                  <input 
                    value={firstName} 
                    onChange={e=>setFirstName(e.target.value)} 
                    className="input-focus-glow w-full bg-[#393A3A]/30 border border-[#E3E1E2]/20 px-4 py-3 rounded-xl text-white placeholder-[#E3E1E2]/40 transition-all duration-300" 
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-3 text-[#E3E1E2]">Apellido</label>
                  <input 
                    value={lastName} 
                    onChange={e=>setLastName(e.target.value)} 
                    className="input-focus-glow w-full bg-[#393A3A]/30 border border-[#E3E1E2]/20 px-4 py-3 rounded-xl text-white placeholder-[#E3E1E2]/40 transition-all duration-300" 
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving} 
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                  saving 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                    : 'btn-primary-gradient hover:scale-105 shadow-lg'
                }`}
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
              </button>
              {saved && <p className="text-green-400 text-sm text-center font-bold">✓ Perfil actualizado exitosamente</p>}
            </form>
            <div className="mt-8 pt-8 border-t border-[#E3E1E2]/10 text-sm text-[#E3E1E2]/60">Funciones adicionales (email, avatar) se agregarán en próximas actualizaciones.</div>
          </div>
        )}

        {/* Tab de Fidelización */}
        {activeTab === 'fidelity' && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
              Sistema de Fidelización
            </h2>
            
            {/* Card de puntos con gradiente premium */}
            <div className="card-glass rounded-2xl p-10 mb-8 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(187, 34, 40, 0.2), rgba(139, 25, 30, 0.1))' }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#BB2228]/20 to-transparent rounded-full blur-3xl"></div>
              <div className="relative z-10 text-center">
                <p className="text-[#E3E1E2]/70 text-sm font-semibold mb-3">⭐ Tus Puntos Acumulados</p>
                <p className="text-8xl font-black text-white mb-2 bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">{fidelityPoints}</p>
                <p className="text-[#E3E1E2]/60">Puntos disponibles para usar en compras futuras</p>
              </div>
            </div>

            {/* Barra de progreso mejorada */}
            <div className="card-glass rounded-2xl p-8 mb-8">
              <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
                <span>📈 Progreso hacia el siguiente nivel</span>
              </h3>
              <div className="bg-[#393A3A]/30 rounded-full h-3 overflow-hidden border border-[#E3E1E2]/10 mb-3">
                <div 
                  className="bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm text-[#E3E1E2]/70">{fidelityPoints % 100} de 100 puntos para alcanzar <span className="font-bold text-white">{nextMilestone} puntos</span></p>
            </div>

            {/* Información en cards mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="card-glass rounded-2xl p-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <h4 className="font-black mb-4 flex items-center gap-2 text-lg">
                  <span className="w-1 h-5 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                  ¿Cómo funcionan los puntos?
                </h4>
                <ul className="text-sm text-[#E3E1E2]/80 space-y-3">
                  <li className="flex items-center gap-3"><span className="text-lg">✓</span> Ganas 1 punto por cada S/. 10 gastados</li>
                  <li className="flex items-center gap-3"><span className="text-lg">✓</span> Los puntos nunca expiran</li>
                  <li className="flex items-center gap-3"><span className="text-lg">✓</span> Úsalos para descuentos en futuras compras</li>
                  <li className="flex items-center gap-3"><span className="text-lg">✓</span> Acceso a ofertas exclusivas</li>
                </ul>
              </div>
              <div className="card-glass rounded-2xl p-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <h4 className="font-black mb-4 flex items-center gap-2 text-lg">
                  <span className="w-1 h-5 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                  Beneficios por Nivel
                </h4>
                <ul className="text-sm text-[#E3E1E2]/80 space-y-3">
                  <li className="flex items-center justify-between"><span>🥉 Básico</span> <span className="text-xs text-[#E3E1E2]/60">0-100 pts</span></li>
                  <li className="flex items-center justify-between"><span>🥈 Plata</span> <span className="badge-gradient-gold text-xs px-2 py-1">5% desc</span></li>
                  <li className="flex items-center justify-between"><span>🥇 Oro</span> <span className="badge-gradient-red text-xs px-2 py-1">10% desc</span></li>
                  <li className="flex items-center justify-between"><span>👑 VIP</span> <span className="badge-gradient-red text-xs px-2 py-1">15% desc</span></li>
                </ul>
              </div>
            </div>

            {user?.lastPurchaseDate && (
              <div className="text-center text-[#E3E1E2]/60 text-sm border-t border-[#E3E1E2]/10 pt-6">
                Última compra: <span className="font-bold text-white">{new Date(user.lastPurchaseDate).toLocaleDateString('es-PE')}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab de Compras */}
        {activeTab === 'orders' && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
              Mis Compras
            </h2>
            
            {ordersQuery.isLoading && (
              <div className="card-glass rounded-2xl p-12 text-center">
                <p className="text-[#E3E1E2]/60 animate-pulse">⏳ Cargando compras...</p>
              </div>
            )}
            {ordersQuery.isError && (
              <div className="card-glass rounded-2xl p-8 border-l-4 border-red-500">
                <p className="text-red-400 font-semibold">❌ Error al cargar compras</p>
              </div>
            )}
            {!ordersQuery.isLoading && !ordersQuery.isError && (!ordersQuery.data || ordersQuery.data.length === 0) && (
              <div className="card-glass rounded-2xl p-12 text-center">
                <p className="text-5xl mb-3">🎬</p>
                <p className="text-[#E3E1E2]/60 font-semibold">No tienes compras registradas aún</p>
                <p className="text-[#E3E1E2]/40 text-sm mt-2">Comienza a comprar entradas para ver tu historial aquí</p>
              </div>
            )}
            {ordersQuery.data && ordersQuery.data.length > 0 && (
              <div className="space-y-4">
                {ordersQuery.data.map((order: any, idx: number) => (
                  <div 
                    key={order.id} 
                    className="card-glass rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-white mb-2">🎫 {order.movieTitle}</p>
                        <div className="flex gap-6 text-sm text-[#E3E1E2]/70">
                          <span>📅 {new Date(order.purchaseDate).toLocaleDateString('es-PE')}</span>
                          <span>💰 <span className="font-bold text-white">S/ {order.totalAmount.toFixed(2)}</span></span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleDownloadPDF(order.id)}
                          className="btn-primary-gradient px-4 py-2 rounded-lg hover:scale-105 transition-transform text-sm font-bold shadow-lg"
                        >
                          📥 PDF
                        </button>
                        <button 
                          onClick={() => handleViewDetails(order.id)}
                          className="btn-secondary-outline px-4 py-2 rounded-lg hover:scale-105 transition-transform text-sm font-bold"
                        >
                          👁️ Ver
                        </button>
                      </div>
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