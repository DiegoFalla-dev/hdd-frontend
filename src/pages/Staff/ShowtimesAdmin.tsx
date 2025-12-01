import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllCinemas } from '../../services/cinemaService';
import { fetchAllMovies } from '../../services/moviesService';
import api from '../../services/apiClient';
import { getTheatersByCinema } from '../../services/theaterService';
import type { Showtime } from '../../types/Showtime';
import type { Cinema } from '../../types/Cinema';
import type { Movie } from '../../types/Movie';
import type { Theater } from '../../types/Theater';

interface NewShowtimeForm {
  movieId?: number;
  cinemaId?: number;
  theaterId?: number;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  format?: string;
  language?: string;
}

export default function ShowtimesAdmin() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [form, setForm] = useState<NewShowtimeForm>({});
  const [existing, setExisting] = useState<Showtime[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadShowtimes = async () => {
    if (!form.movieId || !form.cinemaId) { setExisting([]); return; }
    const params: Record<string, unknown> = { movie: form.movieId, cinema: form.cinemaId };
    const resp = await api.get<Showtime[]>('/showtimes', { params });
    setExisting(Array.isArray(resp.data) ? resp.data : []);
  };

  useEffect(() => { loadShowtimes(); }, [form.movieId, form.cinemaId]);

  // Load theaters when cinema changes
  useEffect(() => {
    const loadTheaters = async () => {
      if (!form.cinemaId) { setTheaters([]); setForm(f => ({ ...f, theaterId: undefined })); return; }
      const ts = await getTheatersByCinema(form.cinemaId);
      setTheaters(Array.isArray(ts) ? ts : []);
    };
    loadTheaters();
  }, [form.cinemaId]);

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
    setErrorMsg('');
    const { movieId, cinemaId, theaterId, date, time, format, language } = form;
    if (!cinemaId) { setErrorMsg('Seleccione un cine.'); return; }
    if (!movieId) { setErrorMsg('Seleccione una película.'); return; }
    if (!theaterId) { setErrorMsg('Seleccione una sala.'); return; }
    if (!date) { setErrorMsg('Seleccione la fecha.'); return; }
    if (!time) { setErrorMsg('Seleccione la hora.'); return; }
    if (!format) { setErrorMsg('Seleccione el formato.'); return; }
    if (!language) { setErrorMsg('Seleccione el idioma.'); return; }

    const mapFormat = (f?: string) => {
      if (!f) return undefined;
      if (f === '2D') return '_2D';
      if (f === '3D') return '_3D';
      return f; // XD stays as XD
    };
    const payload = { movieId, cinemaId, theaterId, date, time, format: mapFormat(format), language };
    try {
      setSaving(true);
      await api.post('/showtimes', payload);
      // recargar lista y limpiar
      await loadShowtimes();
      setForm({ cinemaId, movieId });
    } catch (err: any) {
      console.error('Error creando función', err);
      const msg = (err?.response?.data?.message) || err?.message || 'Error al crear función';
      setErrorMsg(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const timeOptions = useMemo(() => (
    ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"]
  ), []);
  const formatOptions = ["2D","3D","XD"];
  const languageOptions = ["Español","Inglés","Subtitulado"];

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen pt-16">
        <Navbar />
        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Funciones</h1>

          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Cine *</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.cinemaId || ''} onChange={e => setForm(f => ({ ...f, cinemaId: Number(e.target.value) }))}>
                <option value="">Seleccionar...</option>
                {cinemas.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Película *</label>
              <select className="p-2 rounded w-full" disabled={!form.cinemaId} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.movieId || ''} onChange={e => setForm(f => ({ ...f, movieId: Number(e.target.value) }))}>
                <option value="">Seleccionar...</option>
                {movies.map(m => (<option key={m.id} value={m.id}>{m.title}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sala *</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.theaterId || ''} onChange={e => setForm(f => ({ ...f, theaterId: Number(e.target.value) }))} disabled={!form.cinemaId || !theaters.length}>
                <option value="">Seleccionar...</option>
                {theaters.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input className="p-2 rounded w-full" disabled={!form.cinemaId} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora *</label>
              <select className="p-2 rounded w-full" disabled={!form.cinemaId} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.time || ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {timeOptions.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Formato *</label>
              <select className="p-2 rounded w-full" disabled={!form.cinemaId} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.format || ''} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {formatOptions.map(fm => (<option key={fm} value={fm}>{fm}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Idioma *</label>
              <select className="p-2 rounded w-full" disabled={!form.cinemaId} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.language || ''} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {languageOptions.map(l => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creando...' : 'Crear Función'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-2 text-sm opacity-80">{errorMsg}</div>
          )}

          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Funciones existentes</h2>
            {/* Agrupar por cineId y mostrar título del cine si está seleccionado */}
            {form.cinemaId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existing
                  .filter(s => s.cinemaId === form.cinemaId)
                  .map(s => (
                    <div key={s.id} className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                      <div className="font-bold">Sala: {s.theaterName || s.theaterId}</div>
                      <div>Inicio: {s.startTime}</div>
                      <div>Formato: {s.format} | Idioma: {s.language}</div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => removeShowtime(s.id!)}>Borrar</button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existing.map(s => (
                  <div key={s.id} className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                    <div className="font-bold">Cine: {cinemas.find(c => c.id === s.cinemaId)?.name || s.cinemaId}</div>
                    <div className="font-bold">Sala: {s.theaterName || s.theaterId}</div>
                    <div>Inicio: {s.startTime}</div>
                    <div>Formato: {s.format} | Idioma: {s.language}</div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => removeShowtime(s.id!)}>Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
