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
    SMALL: { rows: 6, columns: 6 },
    MEDIUM: { rows: 7, columns: 7 },
    LARGE: { rows: 8, columns: 8 },
    XL: { rows: 9, columns: 9 },
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
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Salas</h1>

          <div className="mb-6">
            <label className="mr-4">Cine:</label>
            <select className="p-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={selectedCinema?.id || ''} onChange={e => {
              const c = cines.find(x => x.id === Number(e.target.value));
              setSelectedCinema(c || null);
            }}>
              <option value="">Seleccione</option>
              {cines.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          {selectedCinema && (
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1">Cine seleccionado</label>
                <div className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }}>
                  {selectedCinema.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Sala *</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Sala 1" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <div className="text-xs opacity-70 mt-1">El nombre se autogenera como "Sala N" según las salas existentes del cine.</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Sala *</label>
                <div className="flex flex-wrap gap-2">
                  {(['SMALL','MEDIUM','LARGE','XL'] as const).map(tp => (
                    <button
                      key={tp}
                      type="button"
                      className="px-3 py-2 rounded"
                      style={{ backgroundColor: form.type === tp ? 'var(--cinepal-primary)' : 'var(--cinepal-bg-200)', color: form.type === tp ? 'var(--cinepal-bg-100)' : 'var(--cinepal-gray-900)' }}
                      onClick={() => {
                        const preset = TYPE_PRESETS[tp];
                        setForm(f => ({ ...f, type: tp, rows: preset.rows, columns: preset.columns }));
                      }}
                    >{tp}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Columnas (protegido)</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} value={form.columns ?? 0} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filas (protegido)</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} value={form.rows ?? 0} readOnly />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Capacidad (autocalculada)</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} value={capacityComputed} readOnly />
                <div className="text-xs opacity-70 mt-1">Se calcula como Filas x Columnas según el tipo.</div>
              </div>

              <div className="flex items-end gap-2">
                <button type="submit" className="px-4 py-2 rounded" disabled={saving} style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)', opacity: saving ? 0.7 : 1 }}>
                  {saving ? (editing ? 'Actualizando...' : 'Creando...') : (editing ? 'Actualizar Sala' : 'Crear Sala')}
                </button>
                {editing && <button type="button" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} onClick={() => {
                  setEditing(null);
                  const preset = TYPE_PRESETS[form.type ?? 'SMALL'];
                  setForm({ name: form.name ?? '', capacity: capacityComputed, type: form.type ?? 'SMALL', rows: preset.rows, columns: preset.columns });
                }}>Cancelar</button>}
                {errorMsg && <span className="text-sm opacity-80">{errorMsg}</span>}
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {theaters.map(t => {
              const tipo = t.seatMatrixType ?? t.type;
              const filas = t.rowCount ?? t.rows ?? 0;
              const columnas = t.colCount ?? t.columns ?? 0;
              const capacidad = t.totalSeats ?? t.capacity ?? (filas * columnas);
              const tipoLabel = tipo === 'XLARGE' ? 'XL' : tipo;
              return (
                <div key={t.id} className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                  <div className="font-bold text-xl mb-2">{t.name}</div>
                  <div className="text-sm mb-1">Tipo: {tipoLabel}</div>
                  <div className="text-sm mb-1">Filas: {filas} · Columnas: {columnas}</div>
                  <div className="text-sm mb-2">Total de Asientos: {capacidad}</div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }} onClick={() => onEdit(t)}>Editar</button>
                    <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => onDelete(t)}>Borrar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
