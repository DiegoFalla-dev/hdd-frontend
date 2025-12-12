import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/apiClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Promociones.css';

export interface PromotionDTO {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
}

const PromocionesCodigos: React.FC = () => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch all promotions (both active and expired)
  const { data: allPromotions = [], isLoading, isError } = useQuery<PromotionDTO[]>({
    queryKey: ['promotions'],
    queryFn: async () => {
      const response = await api.get<PromotionDTO[]>('/promotions');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Separate active and expired promotions
  const promotions = allPromotions.filter(p => p.isActive && new Date(p.endDate) > new Date());
  const expiredPromotions = allPromotions.filter(p => !p.isActive || new Date(p.endDate) <= new Date());

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Comentado: formatDiscount no se usa
  /*
  const formatDiscount = (type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return `${value}% de descuento`;
    } else {
      return `S/ ${value.toFixed(2)} de descuento`;
    }
  };
  */

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  const isPromotionEnding = (endDate: string) => {
    const daysRemaining = getDaysRemaining(endDate);
    return daysRemaining <= 7 && daysRemaining > 0;
  };

  return (
    <div className="min-h-screen pt-16 text-neutral-100" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar variant="dark" />
      {/* Header premium con gradiente */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="mb-8 pb-4 border-b border-white/5 animate-slide-up">
          <h1 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            🎟️ Códigos Promocionales
          </h1>
          <p className="text-neutral-400 text-lg">Aprovecha nuestras increíbles ofertas con descuentos especiales en entradas de cine</p>
        </div>

        {/* Contenido principal */}
        <section>
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-[#BB2228] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neutral-400 font-semibold">⏳ Cargando promociones...</p>
              </div>
            </div>
          ) : isError || allPromotions.length === 0 ? (
            <div className="card-glass rounded-2xl p-16 text-center animate-fade-in">
              <p className="text-5xl mb-4">🎟️</p>
              <p className="text-xl text-neutral-400 mb-6">No hay promociones disponibles en este momento</p>
              <button
                onClick={() => navigate('/cartelera')}
                className="btn-primary-gradient px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Ir a Cartelera
              </button>
            </div>
          ) : (
            <>
              {/* PROMOCIONES ACTIVAS */}
              {promotions.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
                    Promociones Activas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {promotions.map((promo, idx) => {
                      const daysRemaining = getDaysRemaining(promo.endDate);
                      const isEnding = isPromotionEnding(promo.endDate);
                      return (
                        <div
                          key={promo.id}
                          className="card-glass rounded-2xl p-6 overflow-hidden relative hover:scale-105 transition-all duration-300 animate-scale-in"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          {/* Badge de descuento grande */}
                          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center shadow-2xl">
                            <div className="text-center">
                              <p className="text-sm text-white/70 font-semibold">{promo.discountType === 'PERCENTAGE' ? 'Descuento' : 'Ahorro'}</p>
                              <p className="text-3xl font-black text-white">
                                {promo.discountType === 'PERCENTAGE' ? `${promo.value}%` : `S/${promo.value}`}
                              </p>
                            </div>
                          </div>
                          {/* Badge de vence pronto */}
                          {isEnding && (
                            <div className="mb-4 inline-block badge-gradient-red text-xs px-3 py-1 rounded-full">
                              ⏰ ¡Vence en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}!
                            </div>
                          )}
                          {/* Descripción */}
                          <div className="mb-6 mt-12">
                            <h3 className="text-xl font-black text-white mb-2 group-hover:text-[#BB2228] transition-colors duration-300">{promo.code}</h3>
                            {promo.description && (
                              <p className="text-neutral-400 text-sm leading-relaxed">{promo.description}</p>
                            )}
                          </div>
                          {/* Detalles */}
                          <div className="space-y-3 mb-6 py-6 border-y border-white/10">
                            {promo.minAmount && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">💰 Compra mínima</span>
                                <span className="font-bold text-[#BB2228]">S/ {promo.minAmount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-neutral-400">📅 Válido hasta</span>
                              <span className="font-bold">{formatDate(promo.endDate)}</span>
                            </div>
                            {promo.maxUses && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">🎯 Usos disponibles</span>
                                <span className="font-bold text-amber-400">{promo.maxUses - promo.currentUses} / {promo.maxUses}</span>
                              </div>
                            )}
                          </div>
                          {/* Botón de acción */}
                          <div className="space-y-3">
                            <button
                              onClick={() => handleCopyCode(promo.code)}
                              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                                copiedCode === promo.code 
                                  ? 'bg-green-600 text-white' 
                                  : 'btn-primary-gradient hover:scale-105 shadow-lg'
                              }`}
                            >
                              {copiedCode === promo.code ? '✓ Copiado al portapapeles' : '📋 Copiar Código'}
                            </button>
                            <button
                              onClick={() => navigate('/cartelera')}
                              className="w-full btn-secondary-outline py-2 rounded-xl font-bold hover:scale-105 transition-transform"
                            >
                              Usar Código
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {promotions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-neutral-400">No hay promociones activas en este momento</p>
                </div>
              )}
              {/* PROMOCIONES EXPIRADAS */}
              {expiredPromotions.length > 0 && (
                <div className="mt-16 pt-16 border-t border-white/10">
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-neutral-400">
                    <span className="w-1 h-6 bg-gradient-to-b from-white/50 to-white/20 rounded-full"></span>
                    Promociones Expiradas
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-50">
                    {expiredPromotions.map((promo, idx) => (
                      <div
                        key={promo.id}
                        className="card-glass rounded-2xl p-6 overflow-hidden relative group animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {/* Overlay de expirado */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-600/40 to-gray-900/40 rounded-2xl flex items-center justify-center z-20 group-hover:opacity-0 transition-opacity duration-300">
                          <span className="text-white font-black text-lg bg-red-600/80 px-6 py-3 rounded-xl backdrop-blur-sm transform -rotate-12">
                            Expirado
                          </span>
                        </div>
                        {/* Badge de descuento */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gray-600/50 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-xs text-white/50 font-semibold line-through">{promo.discountType === 'PERCENTAGE' ? 'Descuento' : 'Ahorro'}</p>
                            <p className="text-2xl font-black text-white/50 line-through">
                              {promo.discountType === 'PERCENTAGE' ? `${promo.value}%` : `S/${promo.value}`}
                            </p>
                          </div>
                        </div>
                        <div className="mb-6 mt-12">
                          <h3 className="text-xl font-black text-neutral-400 line-through">{promo.code}</h3>
                          {promo.description && (
                            <p className="text-neutral-400/40 text-sm leading-relaxed line-through">{promo.description}</p>
                          )}
                        </div>
                        <div className="space-y-3 mb-6 py-6 border-y border-white/5">
                          {promo.minAmount && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-neutral-400/40 line-through">💰 Compra mínima</span>
                              <span className="font-bold text-neutral-400/40 line-through">S/ {promo.minAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-400/40 line-through">📅 Válido hasta</span>
                            <span className="font-bold text-neutral-400/40 line-through">{formatDate(promo.endDate)}</span>
                          </div>
                        </div>
                        <button
                          disabled
                          className="w-full py-3 rounded-xl font-bold text-neutral-400/40 bg-gray-700/30 cursor-not-allowed"
                        >
                          ❌ Expirado
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Sección de información mejorada */}
        <section className="py-16 border-t border-white/10">
          <h2 className="text-3xl font-black mb-12 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-[#BB2228] to-[#8B191E] rounded-full"></span>
            ¿Cómo usar tus códigos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: 1, icon: '🎬', title: 'Selecciona película', desc: 'Elige la película y horario' },
              { step: 2, icon: '🪑', title: 'Asientos y dulcería', desc: 'Completa tu selección' },
              { step: 3, icon: '🛒', title: 'Ve al carrito', desc: 'Revisa tu compra' },
              { step: 4, icon: '💳', title: 'Ingresa código', desc: 'Aplica tu promoción' },
              { step: 5, icon: '✅', title: 'Confirma descuento', desc: 'Verifica y paga' }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="card-glass rounded-2xl p-6 text-center animate-scale-in hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2">
                  <span className="text-sm text-[#BB2228] font-black">PASO {item.step}</span>
                  <div className="text-sm">{item.title}</div>
                </h3>
                <p className="text-xs text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PromocionesCodigos;
