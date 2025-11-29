import { useEffect, useState } from 'react';
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
  const [form, setForm] = useState<Partial<Theater>>({ name: '', capacity: 0 });

  useEffect(() => {
    const load = async () => {
      if (!selectedCinema) { setTheaters([]); return; }
      const data = await getTheatersByCinema(selectedCinema.id);
      setTheaters(data);
    };
    load();
  }, [selectedCinema]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCinema) return;
    if (editing) {
      await updateTheater(editing.id, form);
      setEditing(null);
    } else {
      await createTheater(selectedCinema.id, form);
    }
    setForm({ name: '', capacity: 0 });
    const data = await getTheatersByCinema(selectedCinema.id);
    setTheaters(data);
  };

  const onEdit = (t: Theater) => {
    setEditing(t);
    setForm({ name: t.name, capacity: t.capacity });
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
                <label className="block text-sm font-medium mb-1">Nombre de la Sala *</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Sala VIP 1" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacidad *</label>
                <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: 120" type="number" value={form.capacity || 0} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }}>{editing ? 'Actualizar Sala' : 'Crear Sala'}</button>
                {editing && <button type="button" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} onClick={() => { setEditing(null); setForm({ name: '', capacity: 0 }); }}>Cancelar</button>}
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {theaters.map(t => (
              <div key={t.id} className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                <div className="font-bold text-xl mb-2">{t.name}</div>
                <div className="text-sm mb-2">Capacidad: {t.capacity}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }} onClick={() => onEdit(t)}>Editar</button>
                  <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => onDelete(t)}>Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
