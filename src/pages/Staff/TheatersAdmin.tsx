import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useCinemas } from '../../hooks/useCinemas';
import { getTheatersByCinema, createTheater, updateTheater, deleteTheater } from '../../services/theaterService';
import type { Cinema } from '../../types/Cinema';
import type { Theater } from '../../types/Theater';

export default function TheatersAdmin() {
  const { data: cines = [] } = useCinemas();
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [editing, setEditing] = useState<Theater | null>(null);
  const [form, setForm] = useState<Partial<Theater>>({ name: '', capacity: 0, type: 'SMALL', rows: 6, columns: 6 });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const TYPE_PRESETS: Record<'SMALL'|'MEDIUM'|'LARGE'|'XL', { rows: number; columns: number }> = {
    SMALL: { rows: 6, columns: 7 },
    MEDIUM: { rows: 8, columns: 10 },
    LARGE: { rows: 12, columns: 16 },
    XL: { rows: 16, columns: 20 },
  };

  const capacityComputed = useMemo(() => {
    const r = form.rows ?? 0; const c = form.columns ?? 0;
    return r * c;
  }, [form.rows, form.columns]);

  useEffect(() => {
    const load = async () => {
      if (!selectedCinema) { setTheaters([]); return; }
      const data = await getTheatersByCinema(selectedCinema.id);
      setTheaters(data);
      // Auto-set name as "Sala N" where N continues existing count
      const nextNum = (Array.isArray(data) ? data.length : 0) + 1;
      setForm(f => ({
        ...f,
        name: `Sala ${nextNum}`,
      }));
    };
    load();
  }, [selectedCinema]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedCinema) { setErrorMsg('Seleccione un cine.'); return; }
    if (!form.type) { setErrorMsg('Seleccione el tipo de sala.'); return; }
    const baseName = (form.name || '').trim();
    if (!baseName) { setErrorMsg('El nombre de la sala es requerido.'); return; }

    const payload: Partial<Theater> = {
      name: baseName,
      type: form.type,
      rows: form.rows,
      columns: form.columns,
      capacity: capacityComputed,
    };

    try {
      setSaving(true);
      if (editing) {
        await updateTheater(editing.id, payload);
        setEditing(null);
      } else {
        await createTheater(selectedCinema.id, payload);
      }
      // After create/update, reset next name and keep type presets default
      const currentType = (form.type ?? 'SMALL');
      const preset = TYPE_PRESETS[currentType];
      setForm({ name: '', capacity: 0, type: currentType, rows: preset.rows, columns: preset.columns });
      const data = await getTheatersByCinema(selectedCinema.id);
      setTheaters(data);
      const nextNum = (Array.isArray(data) ? data.length : 0) + 1;
      setForm(f => ({ ...f, name: `Sala ${nextNum}` }));
    } catch (err: any) {
      console.error('Error creando/actualizando sala', err);
      const msg = (err?.response?.data?.message) || err?.message || 'Error al crear/actualizar la sala';
      setErrorMsg(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (t: Theater) => {
    setEditing(t);
    const type = (t.type as any) || 'SMALL';
    const preset = TYPE_PRESETS[type as 'SMALL'|'MEDIUM'|'LARGE'|'XL'] || TYPE_PRESETS.SMALL;
    setForm({ name: t.name, capacity: t.capacity, type, rows: t.rows ?? preset.rows, columns: t.columns ?? preset.columns });
  };

  const onDelete = async (t: Theater) => {
    await deleteTheater(t.id);
    if (selectedCinema) {
      const data = await getTheatersByCinema(selectedCinema.id);
      setTheaters(data);
    }
  };

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }} className="min-h-screen">
        <Navbar variant="dark" />
        
        {/* Header */}
        <div className="relative pt-24 pb-12 px-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-5xl">🎭</div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">
                  Gestión de Salas
                </h1>
                <p className="text-lg text-[#E3E1E2]/70 mt-2 font-semibold">Administra salas y configuración de asientos</p>
              </div>
            </div>
            <div className="w-32 h-1.5 bg-gradient-to-r from-[#BB2228] to-[#8B191E] rounded-full mt-4"></div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">
          {/* Selector de Cine */}
          <div className="mb-8 rounded-xl p-6" style={{ 
            backgroundColor: 'var(--cinepal-gray-800)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <label className="block text-lg font-semibold mb-3">🏢 Seleccionar Cine</label>
            <select 
              className="p-4 rounded-lg w-full md:w-96 text-lg transition-all focus:ring-2 focus:ring-red-500" 
              style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
              value={selectedCinema?.id || ''} 
              onChange={e => {
                const c = cines.find(x => x.id === Number(e.target.value));
                setSelectedCinema(c || null);
              }}
            >
              <option value="">Seleccione un cine...</option>
              {cines.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          {selectedCinema && (
            <form onSubmit={onSubmit} className="rounded-xl p-8 mb-8 relative overflow-hidden" style={{ 
              backgroundColor: 'var(--cinepal-gray-800)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }}>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 to-red-800" />
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">{editing ? '✏️' : '➕'}</span>
                {editing ? 'Editar Sala' : 'Nueva Sala'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Cine seleccionado</label>
                  <div className="p-4 rounded-lg w-full font-semibold" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }}>
                    {selectedCinema.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Nombre de la Sala *</label>
                  <input 
                    className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                    style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                    placeholder="Ej: Sala 1" 
                    value={form.name || ''} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  />
                  <div className="text-xs text-gray-500 mt-1">El nombre se autogenera como "Sala N"</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Tipo de Sala *</label>
                  <div className="flex flex-wrap gap-2">
                    {(['SMALL','MEDIUM','LARGE','XL'] as const).map(tp => (
                      <button
                        key={tp}
                        type="button"
                        className="px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: form.type === tp ? 'var(--cinepal-primary)' : 'var(--cinepal-gray-700)', 
                          color: 'var(--cinepal-bg-100)',
                          border: form.type === tp ? '2px solid rgba(220, 38, 38, 0.5)' : '2px solid transparent'
                        }}
                        onClick={() => {
                          const preset = TYPE_PRESETS[tp];
                          setForm(f => ({ ...f, type: tp, rows: preset.rows, columns: preset.columns }));
                        }}
                      >
                        {tp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Columnas</label>
                  <input 
                    className="p-4 rounded-lg w-full" 
                    style={{ backgroundColor: 'var(--cinepal-gray-600)', color: 'var(--cinepal-gray-400)', border: 'none' }} 
                    value={form.columns ?? 0} 
                    readOnly 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Filas</label>
                  <input 
                    className="p-4 rounded-lg w-full" 
                    style={{ backgroundColor: 'var(--cinepal-gray-600)', color: 'var(--cinepal-gray-400)', border: 'none' }} 
                    value={form.rows ?? 0} 
                    readOnly 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Capacidad Total</label>
                  <div className="p-4 rounded-lg w-full font-bold text-xl text-center bg-gradient-to-r from-red-600 to-red-700 text-white">
                    {capacityComputed} asientos
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">Filas × Columnas</div>
                </div>

                <div className="md:col-span-3 flex items-center gap-3 flex-wrap">
                  <button 
                    type="submit" 
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white"
                    disabled={saving}
                    style={{ opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? (editing ? '⏳ Actualizando...' : '⏳ Creando...') : (editing ? '✓ Actualizar Sala' : '+ Crear Sala')}
                  </button>
                  {editing && (
                    <button 
                      type="button" 
                      className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" 
                      style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} 
                      onClick={() => {
                        setEditing(null);
                        const preset = TYPE_PRESETS[form.type ?? 'SMALL'];
                        setForm({ name: form.name ?? '', capacity: capacityComputed, type: form.type ?? 'SMALL', rows: preset.rows, columns: preset.columns });
                      }}
                    >
                      ✕ Cancelar
                    </button>
                  )}
                  {errorMsg && (
                    <div className="flex items-center px-4 py-3 rounded-lg bg-red-500/20 text-red-300">
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Listado de Salas */}
          {selectedCinema && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-2xl">🎬</span>
                Salas de {selectedCinema.name} ({theaters.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theaters.map(t => {
                  const tipo = t.seatMatrixType ?? t.type;
                  const filas = t.rowCount ?? t.rows ?? 0;
                  const columnas = t.colCount ?? t.columns ?? 0;
                  const capacidad = t.totalSeats ?? t.capacity ?? (filas * columnas);
                  const tipoLabel = tipo === 'XLARGE' ? 'XL' : tipo;
                  return (
                    <div 
                      key={t.id} 
                      className="rounded-xl p-6 group hover:scale-105 transition-all duration-300 relative overflow-hidden" 
                      style={{ 
                        backgroundColor: 'var(--cinepal-gray-800)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-600/20 to-transparent rounded-bl-full" />
                      
                      <div className="relative z-10">
                        <div className="font-bold text-2xl mb-3">{t.name}</div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full font-medium">{tipoLabel}</span>
                          </div>
                          <div className="text-gray-400 text-sm">📐 Filas: {filas} · Columnas: {columnas}</div>
                          <div className="text-lg font-bold text-red-400">🪑 {capacidad} asientos</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105" 
                            style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} 
                            onClick={() => onEdit(t)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white" 
                            onClick={() => onDelete(t)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 to-red-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
