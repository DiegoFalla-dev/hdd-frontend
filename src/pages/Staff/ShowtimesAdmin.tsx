import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllCinemas } from '../../services/cinemaService';
import { fetchAllMovies } from '../../services/moviesService';
import api from '../../services/apiClient';
import type { Showtime } from '../../types/Showtime';
import type { Cinema } from '../../types/Cinema';
import type { Movie } from '../../types/Movie';

interface NewShowtimeForm {
  movieId?: number;
  cinemaId?: number;
  theaterId?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  format?: string;
  language?: string;
  price?: number;
}

export default function ShowtimesAdmin() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [form, setForm] = useState<NewShowtimeForm>({});
  const [existing, setExisting] = useState<Showtime[]>([]);

  const loadShowtimes = async () => {
    if (!form.movieId || !form.cinemaId) { setExisting([]); return; }
    const params: Record<string, unknown> = { movie: form.movieId, cinema: form.cinemaId };
    const resp = await api.get<Showtime[]>('/showtimes', { params });
    setExisting(Array.isArray(resp.data) ? resp.data : []);
  };

  useEffect(() => { loadShowtimes(); }, [form.movieId, form.cinemaId]);

  const removeShowtime = async (id: number) => {
    await api.delete(`/showtimes/${id}`);
    await loadShowtimes();
  };

  useEffect(() => {
    const load = async () => {
      const [m, c] = await Promise.all([fetchAllMovies(), getAllCinemas()]);
      setMovies(m); setCinemas(c);
    };
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    await api.post('/showtimes', payload);
    setForm({});
  };

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Funciones</h1>

          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Película *</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.movieId || ''} onChange={e => setForm(f => ({ ...f, movieId: Number(e.target.value) }))}>
                <option value="">Seleccionar...</option>
                {movies.map(m => (<option key={m.id} value={m.id}>{m.title}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cine *</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.cinemaId || ''} onChange={e => setForm(f => ({ ...f, cinemaId: Number(e.target.value) }))}>
                <option value="">Seleccionar...</option>
                {cinemas.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sala ID *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: 1" value={form.theaterId || ''} onChange={e => setForm(f => ({ ...f, theaterId: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} type="time" value={form.time || ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Formato</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: _2D, _3D, XD" value={form.format || ''} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Idioma</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Español, Inglés" value={form.language || ''} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} type="number" step="0.01" placeholder="Ej: 9.99" value={form.price || 0} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="px-4 py-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }}>Crear Función</button>
            </div>
          </form>

          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Funciones existentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existing.map(s => (
                <div key={s.id} className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                  <div className="font-bold">Sala: {s.theaterName || s.theaterId}</div>
                  <div>Inicio: {s.startTime}</div>
                  <div>Formato: {s.format} | Idioma: {s.language}</div>
                  <div className="flex gap-2 mt-2">
                    {/* Edición simple: cambiar precio/formato/idioma si se requiere en el futuro */}
                    <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => removeShowtime(s.id!)}>Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
