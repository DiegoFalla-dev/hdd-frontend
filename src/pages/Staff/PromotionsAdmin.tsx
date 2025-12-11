import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/apiClient';
import type { Promotion } from '../../types/Promotion';
import './PromotionsAdmin.css';

interface PromotionForm {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxUses: number | null;
  isActive: boolean;
}

function PromotionsAdmin() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [q, setQ] = useState<string>('');
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionForm>({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: 0,
    startDate: '',
    endDate: '',
    minAmount: null,
    maxUses: null,
    isActive: true
  });
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get<Promotion[]>('/promotions');
      setPromotions(response.data);
    } catch {
      setPromotions([]);
      setMessage('Error al cargar promociones');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return promotions;
    return promotions.filter(p =>
      (p.code || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  }, [q, promotions]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validaciones
    if (!form.code.trim()) {
      setMessage('El código es requerido');
      setMessageType('error');
      return;
    }
    if (!form.description.trim()) {
      setMessage('La descripción es requerida');
      setMessageType('error');
      return;
    }
    if (form.value <= 0) {
      setMessage('El valor debe ser mayor a 0');
      setMessageType('error');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setMessage('Las fechas de inicio y fin son requeridas');
      setMessageType('error');
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setMessage('La fecha de inicio debe ser menor a la fecha de fin');
      setMessageType('error');
      return;
    }

    try {
      const payload = {
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        value: form.value,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        minAmount: form.minAmount ? parseFloat(form.minAmount.toString()) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses.toString()) : null,
        isActive: form.isActive
      };

      if (editing?.id) {
        await api.put(`/promotions/${editing.id}`, payload);
        setMessage('Promoción actualizada correctamente');
      } else {
        await api.post('/promotions', payload);
        setMessage('Promoción creada correctamente');
      }
      setMessageType('success');
      resetForm();
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error al guardar promoción');
      setMessageType('error');
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      value: 0,
      startDate: '',
      endDate: '',
      minAmount: null,
      maxUses: null,
      isActive: true
    });
    setEditing(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setForm({
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      value: promotion.value,
      startDate: formatDate(promotion.startDate),
      endDate: formatDate(promotion.endDate),
      minAmount: promotion.minAmount,
      maxUses: promotion.maxUses,
      isActive: promotion.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return;

    try {
      await api.delete(`/promotions/${id}`);
      setMessage('Promoción eliminada correctamente');
      setMessageType('success');
      await load();
    } catch {
      setMessage('Error al eliminar promoción');
      setMessageType('error');
    }
  };

  const isActive = (promo: Promotion) => {
    const now = new Date();
    return (
      promo.isActive &&
      new Date(promo.startDate) <= now &&
      now <= new Date(promo.endDate)
    );
  };

  return (
    <ProtectedRoute roles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen pt-16 text-neutral-100" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
        <Navbar variant="dark" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
          {/* Header premium con gradiente */}
          <div className="mb-8 pb-4 border-b border-white/5 animate-slide-up">
            <h1 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
              🎟️ Gestión de Promociones
            </h1>
            <p className="text-neutral-400 text-lg">Administra códigos promocionales y descuentos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {/* Formulario glassmorphism */}
            <div className="card-glass rounded-2xl p-8 shadow-xl animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                {editing ? '✏️ Editar Promoción' : '➕ Nueva Promoción'}
              </h2>
              {message && (
                <div className={`rounded-lg px-4 py-3 mb-4 font-semibold ${messageType === 'success' ? 'bg-green-700/20 text-green-400' : 'bg-red-700/20 text-red-300'}`}>{messageType === 'success' ? '✓' : '✕'} {message}</div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código */}
                  <div>
                    <label className="block font-semibold mb-1">Código *</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="NAVIDAD2024"
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                      disabled={editing !== null}
                    />
                    <small className="text-neutral-400">El código es único y no se puede cambiar después de crear</small>
                  </div>
                  {/* Tipo de descuento */}
                  <div>
                    <label className="block font-semibold mb-1">Tipo de Descuento *</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED_AMOUNT">Monto Fijo (S/.)</option>
                    </select>
                  </div>
                  {/* Valor */}
                  <div>
                    <label className="block font-semibold mb-1">Valor {form.discountType === 'PERCENTAGE' ? '(%)' : '(S/.)'} *</label>
                    <input
                      type="number"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })}
                      placeholder={form.discountType === 'PERCENTAGE' ? '20' : '50'}
                      step={form.discountType === 'PERCENTAGE' ? '0.01' : '1'}
                      min="0"
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    />
                  </div>
                  {/* Estado */}
                  <div>
                    <label className="block font-semibold mb-1">Estado</label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="accent-[#BB2228]"
                      />
                      <span className="text-neutral-300">Activa</span>
                    </label>
                  </div>
                  {/* Fecha inicio */}
                  <div>
                    <label className="block font-semibold mb-1">Fecha Inicio *</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    />
                  </div>
                  {/* Fecha fin */}
                  <div>
                    <label className="block font-semibold mb-1">Fecha Fin *</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    />
                  </div>
                  {/* Monto mínimo */}
                  <div>
                    <label className="block font-semibold mb-1">Monto Mínimo (Opcional)</label>
                    <input
                      type="number"
                      value={form.minAmount || ''}
                      onChange={(e) => setForm({ ...form, minAmount: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="100"
                      step="0.01"
                      min="0"
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    />
                    <small className="text-neutral-400">Monto mínimo de compra requerido</small>
                  </div>
                  {/* Máximo de usos */}
                  <div>
                    <label className="block font-semibold mb-1">Máximo de Usos (Opcional)</label>
                    <input
                      type="number"
                      value={form.maxUses || ''}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="1000"
                      min="0"
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                    />
                    <small className="text-neutral-400">Dejar vacío para ilimitado</small>
                  </div>
                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-1">Descripción *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe brevemente la promoción"
                      className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="btn-primary-gradient px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
                    {editing ? '💾 Actualizar' : '➕ Crear'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition"
                    >
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
            {/* Tabla de promociones glassmorphism */}
            <div className="card-glass rounded-2xl p-8 shadow-xl animate-slide-up">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">📋 Promociones</h2>
              <div className="mb-6">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por código o descripción..."
                  className="w-full p-3 rounded-lg bg-black/30 border border-white/10 focus:ring-2 focus:ring-[#BB2228] text-white"
                />
              </div>
              {loading ? (
                <div className="text-center py-8 text-neutral-400">Cargando promociones...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  {promotions.length === 0 ? 'No hay promociones' : 'No se encontraron resultados'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr className="text-neutral-400 border-b border-white/10">
                        <th className="py-2 px-4">Código</th>
                        <th className="py-2 px-4">Descuento</th>
                        <th className="py-2 px-4">Descripción</th>
                        <th className="py-2 px-4">Rango de Fechas</th>
                        <th className="py-2 px-4">Mín./Máx.</th>
                        <th className="py-2 px-4">Estado</th>
                        <th className="py-2 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((promo) => (
                        <tr key={promo.id} className={isActive(promo) ? 'bg-white/5' : 'bg-black/10'}>
                          <td className="py-2 px-4 font-bold text-white">{promo.code}</td>
                          <td className="py-2 px-4 text-[#BB2228] font-bold">
                            {promo.discountType === 'PERCENTAGE' ? `${promo.value}%` : `S/ ${promo.value.toFixed(2)}`}
                          </td>
                          <td className="py-2 px-4 text-neutral-300">
                            <small>{promo.description.substring(0, 60)}...</small>
                          </td>
                          <td className="py-2 px-4 text-neutral-400">
                            <small>
                              {new Date(promo.startDate).toLocaleDateString('es-PE')} →{' '}
                              {new Date(promo.endDate).toLocaleDateString('es-PE')}
                            </small>
                          </td>
                          <td className="py-2 px-4 text-neutral-400">
                            <small>
                              {promo.minAmount ? `S/ ${promo.minAmount.toFixed(2)}` : '-'} / {promo.maxUses || '∞'}
                            </small>
                          </td>
                          <td className="py-2 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${isActive(promo) ? 'bg-green-700/30 text-green-400' : 'bg-gray-700/30 text-neutral-400'}`}>
                              {isActive(promo) ? '✓ Activa' : '○ Inactiva'}
                            </span>
                          </td>
                          <td className="py-2 px-4 flex gap-2">
                            <button
                              onClick={() => handleEdit(promo)}
                              className="px-3 py-1 rounded-lg bg-[#BB2228]/80 text-white hover:bg-[#BB2228] transition"
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-red-700 transition"
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default PromotionsAdmin;
