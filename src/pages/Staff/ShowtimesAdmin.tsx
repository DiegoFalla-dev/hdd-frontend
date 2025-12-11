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
  price?: number;
}

export default function ShowtimesAdmin() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [form, setForm] = useState<NewShowtimeForm>({});
  const [existing, setExisting] = useState<Showtime[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadShowtimes = async () => {
    if (!form.cinemaId) { setExisting([]); return; }
    const params: Record<string, unknown> = { cinema: form.cinemaId };
    if (form.movieId) params.movie = form.movieId;
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
    if (!confirm('¿Estás seguro de eliminar esta función?')) return;
    try {
      await api.delete(`/showtimes/${id}`);
      await loadShowtimes();
    } catch (err) {
      console.error('Error eliminando función', err);
      setErrorMsg('Error al eliminar la función');
    }
  };

  const editShowtime = (showtime: Showtime) => {
    setEditingId(showtime.id!);
    setForm({
      cinemaId: showtime.cinemaId,
      movieId: showtime.movieId,
      theaterId: showtime.theaterId,
      date: showtime.date,
      time: showtime.time,
      format: showtime.format === '_2D' ? '2D' : showtime.format === '_3D' ? '3D' : showtime.format,
      language: showtime.language,
      price: showtime.price,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ cinemaId: form.cinemaId });
    setErrorMsg('');
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
    const { movieId, cinemaId, theaterId, date, time, format, language, price } = form;
    if (!cinemaId) { setErrorMsg('Seleccione un cine.'); return; }
    if (!movieId) { setErrorMsg('Seleccione una película.'); return; }
    if (!theaterId) { setErrorMsg('Seleccione una sala.'); return; }
    if (!date) { setErrorMsg('Seleccione la fecha.'); return; }
    if (!time) { setErrorMsg('Seleccione la hora.'); return; }
    if (!format) { setErrorMsg('Seleccione el formato.'); return; }
    if (!language) { setErrorMsg('Seleccione el idioma.'); return; }
    if (!price || price <= 0) { setErrorMsg('Ingrese un precio válido.'); return; }

    const mapFormat = (f?: string) => {
      if (!f) return undefined;
      if (f === '2D') return '_2D';
      if (f === '3D') return '_3D';
      return f; // XD stays as XD
    };
    const payload = { movieId, cinemaId, theaterId, date, time, format: mapFormat(format), language, price };
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/showtimes/${editingId}`, payload);
      } else {
        await api.post('/showtimes', payload);
      }
      // recargar lista y limpiar
      await loadShowtimes();
      setForm({ cinemaId, movieId });
      setEditingId(null);
    } catch (err: any) {
      console.error(editingId ? 'Error editando función' : 'Error creando función', err);
      const msg = (err?.response?.data?.message) || err?.message || (editingId ? 'Error al editar función' : 'Error al crear función');
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
      <div style={{ background: "linear-gradient(180deg, #141113 0%, #0b0b0b 100%)" }} className="min-h-screen">
        <Navbar variant="dark" />
        
        {/* Header */}
        <div className="relative pt-24 pb-12 px-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-5xl">🎞️</div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-[#BB2228] to-[#E3E1E2] bg-clip-text text-transparent">
                  Gestión de Funciones
                </h1>
                <p className="text-lg text-[#E3E1E2]/70 mt-2 font-semibold">Programa horarios y precios de películas</p>
              </div>
            </div>
            <div className="w-32 h-1.5 bg-gradient-to-r from-[#BB2228] to-[#8B191E] rounded-full mt-4"></div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">
          {/* Formulario */}
          <form onSubmit={create} className="rounded-xl p-8 mb-8 relative overflow-hidden" style={{ 
            backgroundColor: 'var(--cinepal-gray-800)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 to-red-800" />
            
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">{editingId ? '✏️' : '➕'}</span>
              {editingId ? 'Editar Función' : 'Nueva Función'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-300">🏢 Cine *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  value={form.cinemaId || ''} 
                  onChange={e => setForm(f => ({ ...f, cinemaId: Number(e.target.value) }))}
                >
                  <option value="">Seleccionar cine...</option>
                  {cinemas.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">🎬 Película *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  value={form.movieId || ''} 
                  onChange={e => setForm(f => ({ ...f, movieId: Number(e.target.value) }))}
                >
                  <option value="">Seleccionar película...</option>
                  {movies.map(m => (<option key={m.id} value={m.id}>{m.title}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">🎭 Sala *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ 
                    backgroundColor: (form.cinemaId && theaters.length) ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: (form.cinemaId && theaters.length) ? 1 : 0.6
                  }} 
                  value={form.theaterId || ''} 
                  onChange={e => setForm(f => ({ ...f, theaterId: Number(e.target.value) }))} 
                  disabled={!form.cinemaId || !theaters.length}
                >
                  <option value="">Seleccionar sala...</option>
                  {theaters.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">📅 Fecha *</label>
                <input 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  type="date" 
                  value={form.date || ''} 
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">⏰ Hora *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  value={form.time || ''} 
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                >
                  <option value="">Seleccionar hora...</option>
                  {timeOptions.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">🎥 Formato *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  value={form.format || ''} 
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                >
                  <option value="">Seleccionar formato...</option>
                  {formatOptions.map(fm => (<option key={fm} value={fm}>{fm}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">🗣️ Idioma *</label>
                <select 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  value={form.language || ''} 
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                >
                  <option value="">Seleccionar idioma...</option>
                  {languageOptions.map(l => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">💰 Precio *</label>
                <input 
                  className="p-4 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  disabled={!form.cinemaId} 
                  style={{ 
                    backgroundColor: form.cinemaId ? 'var(--cinepal-gray-700)' : 'var(--cinepal-gray-600)', 
                    color: 'var(--cinepal-bg-100)', 
                    border: 'none',
                    opacity: form.cinemaId ? 1 : 0.6
                  }} 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="10.00" 
                  value={form.price || ''} 
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} 
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-3 flex-wrap">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? (editingId ? '⏳ Guardando...' : '⏳ Creando...') : (editingId ? '✓ Guardar Cambios' : '+ Crear Función')}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit} 
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" 
                    style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }}
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

          {/* Listado de Funciones */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              {form.cinemaId 
                ? `Funciones de ${cinemas.find(c => c.id === form.cinemaId)?.name || 'este cine'} (${existing.filter(s => s.cinemaId === form.cinemaId).length})`
                : `Todas las Funciones (${existing.length})`
              }
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(form.cinemaId 
                ? existing.filter(s => s.cinemaId === form.cinemaId)
                : existing
              ).map(s => (
                <div 
                  key={s.id} 
                  className="rounded-xl p-6 group hover:scale-105 transition-all duration-300 relative overflow-hidden" 
                  style={{ 
                    backgroundColor: 'var(--cinepal-gray-800)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-600/20 to-transparent rounded-bl-full" />
                  
                  <div className="relative z-10">
                    {!form.cinemaId && (
                      <div className="font-bold text-lg mb-2 text-red-400">
                        🏢 {cinemas.find(c => c.id === s.cinemaId)?.name || `Cine ${s.cinemaId}`}
                      </div>
                    )}
                    <div className="font-bold text-xl mb-3">
                      🎭 {s.theaterName || `Sala ${s.theaterId}`}
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="text-gray-300">⏰ {s.startTime}</div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded font-medium">{s.format}</span>
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{s.language}</span>
                      </div>
                      <div className="text-lg font-bold text-red-400">💰 ${s.price?.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105" 
                        style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} 
                        onClick={() => editShowtime(s)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white" 
                        onClick={() => removeShowtime(s.id!)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 to-red-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
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
