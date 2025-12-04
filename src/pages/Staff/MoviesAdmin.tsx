import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { fetchAllMovies, createMovie, updateMovie, deleteMovie } from '../../services/moviesService';
import type { Movie } from '../../types/Movie';

interface MovieForm {
  title: string;
  synopsis: string;
  genre: string;
  classification: string;
  duration: string;
  cardImageUrl: string;
  bannerUrl: string;
  trailerUrl: string;
  cast: string;
  status: string;
}

function MoviesAdmin() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [q, setQ] = useState<string>('');
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<MovieForm>({
    title: '',
    synopsis: '',
    genre: '',
    classification: '',
    duration: '',
    cardImageUrl: '',
    bannerUrl: '',
    trailerUrl: '',
    cast: '',
    status: 'NOW_PLAYING'
  });
  const [message, setMessage] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllMovies();
      setMovies(data);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return movies;
    return movies.filter(m => (m.title || '').toLowerCase().includes(term) || (m.genre || '').toLowerCase().includes(term));
  }, [q, movies]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload: any = {
        ...form,
        status: form.status as Movie['status'],
        cast: form.cast ? form.cast.split(',').map((c: string) => c.trim()).filter(Boolean) : []
      };
      if (editing?.id) {
        await updateMovie(Number(editing.id), payload);
        setMessage('Película actualizada');
      } else {
        await createMovie(payload);
        setMessage('Película creada');
      }
      setForm({ title: '', synopsis: '', genre: '', classification: '', duration: '', cardImageUrl: '', bannerUrl: '', trailerUrl: '', cast: '', status: 'NOW_PLAYING' });
      setEditing(null);
      await load();
    } catch {
      setMessage('Error al guardar película');
    }
  };

  const onEdit = (m: Movie & { cardImageUrl?: string; bannerUrl?: string; cast?: string[]; classification?: string; duration?: string }) => {
    setEditing(m);
    setForm({
      title: m.title || '',
      synopsis: m.synopsis || '',
      genre: m.genre || '',
      classification: m.classification || '',
      duration: m.duration || '',
      cardImageUrl: m.cardImageUrl || m.posterUrl || '',
      bannerUrl: m.bannerUrl || '',
      trailerUrl: m.trailerUrl || '',
      cast: Array.isArray(m.cast) ? m.cast.join(', ') : '',
      status: m.status || 'NOW_PLAYING',
    });
  };

  const onDelete = async (m: Movie) => {
    setMessage('');
    try {
      await deleteMovie(Number(m.id));
      setMessage('Película eliminada');
      await load();
    } catch {
      setMessage('Error al eliminar película');
    }
  };

  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div>
        <Navbar variant="dark" />
        <main className="min-h-screen text-white p-6 pt-20" style={{ backgroundColor: 'var(--cinepal-gray-900)' }}>
          <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Administración de Películas</h1>

          <div className="mb-6 flex items-center gap-3">
            <input className="p-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Buscar por título o género" value={q} onChange={e => setQ(e.target.value)} />
            {message && <span className="text-sm opacity-80">{message}</span>}
          </div>

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Avengers: Endgame" required value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Género *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Acción, Aventura" required value={form.genre || ''} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clasificación</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.classification || ''} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}>
                <option value="">Seleccionar...</option>
                <option value="G">G - Todas las edades</option>
                <option value="PG">PG - Guía paterna</option>
                <option value="PG-13">PG-13 - Mayores de 13</option>
                <option value="R">R - Restringida</option>
                <option value="NC-17">NC-17 - Solo adultos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duración *</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: 2h 30m" required value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={form.status || 'NOW_PLAYING'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="NOW_PLAYING">En cartelera</option>
                <option value="PRESALE">Preventa</option>
                <option value="UPCOMING">Próximamente</option>
                <option value="ENDED">Finalizada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Elenco</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Actor 1, Actor 2, Actor 3" value={form.cast || ''} onChange={e => setForm(f => ({ ...f, cast: e.target.value }))} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Sinopsis</label>
              <textarea className="p-2 rounded w-full" rows={3} style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Descripción completa de la película..." value={form.synopsis || ''} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Card Image URL</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: https://example.com/poster.jpg" value={form.cardImageUrl || ''} onChange={e => setForm(f => ({ ...f, cardImageUrl: e.target.value }))} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Banner URL</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: https://example.com/banner.jpg" value={form.bannerUrl || ''} onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Trailer URL</label>
              <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: https://youtube.com/watch?v=..." value={form.trailerUrl || ''} onChange={e => setForm(f => ({ ...f, trailerUrl: e.target.value }))} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }}>{editing ? 'Actualizar' : 'Crear'}</button>
              {editing && <button type="button" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} onClick={() => { setEditing(null); setForm({ title: '', synopsis: '', genre: '', classification: '', duration: '', cardImageUrl: '', bannerUrl: '', trailerUrl: '', cast: '', status: 'NOW_PLAYING' }); }}>Cancelar</button>}
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="opacity-80">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="opacity-80">No hay películas</div>
            ) : (
              filtered.map((m: Movie & { cardImageUrl?: string; bannerUrl?: string; cast?: string[]; classification?: string; duration?: string }) => (
                <div key={m.id} className="rounded overflow-hidden" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
                  {(m.cardImageUrl || m.posterUrl) && (
                    <img src={m.cardImageUrl || m.posterUrl} alt={m.title} style={{ width: '100%', height: 260, objectFit: 'cover' }} />
                  )}
                  <div className="p-4">
                    <div className="text-xl font-semibold mb-1">{m.title}</div>
                    <div className="text-sm opacity-80 mb-2">{m.genre} • {m.duration || ''} {m.classification ? `• ${m.classification}` : ''}</div>
                    <div className="text-sm opacity-80 line-clamp-3">{m.synopsis}</div>
                    {m.cast && Array.isArray(m.cast) && m.cast.length > 0 && (
                      <div className="text-xs opacity-70 mt-2">Elenco: {m.cast.slice(0, 3).join(', ')}</div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }} onClick={() => onEdit(m)}>Editar</button>
                      <button className="px-3 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }} onClick={() => onDelete(m)}>Borrar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default MoviesAdmin
