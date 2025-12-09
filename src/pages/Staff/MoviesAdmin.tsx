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
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen">
        <Navbar variant="dark" />
        
        {/* Header */}
        <div className="relative pt-24 pb-12 px-8" style={{ 
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(127, 29, 29, 0.1) 100%)'
        }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-5xl">🎬</div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Gestión de Películas
                </h1>
                <p className="text-gray-400 mt-1">Administra el catálogo completo de películas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">
          {/* Buscador */}
          <div className="mb-8">
            <input 
              type="text"
              placeholder="🔍 Buscar por título o género..."
              className="p-4 rounded-xl w-full md:w-96 text-lg transition-all focus:ring-2 focus:ring-red-500"
              style={{ backgroundColor: 'var(--cinepal-gray-800)', color: 'var(--cinepal-bg-100)', border: 'none' }}
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="rounded-xl p-8 mb-8 relative overflow-hidden" style={{ 
            backgroundColor: 'var(--cinepal-gray-800)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700" />
            
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">{editing ? '✏️' : '➕'}</span>
              {editing ? 'Editar Película' : 'Nueva Película'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Título *</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="Ej: Avengers: Endgame" 
                  required 
                  value={form.title || ''} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Género *</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="Ej: Acción, Aventura" 
                  required 
                  value={form.genre || ''} 
                  onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Clasificación</label>
                <select 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  value={form.classification || ''} 
                  onChange={e => setForm(f => ({ ...f, classification: e.target.value }))}
                >
                  <option value="">Seleccionar...</option>
                  <option value="G">G - Todas las edades</option>
                  <option value="PG">PG - Guía paterna</option>
                  <option value="PG-13">PG-13 - Mayores de 13</option>
                  <option value="R">R - Restringida</option>
                  <option value="NC-17">NC-17 - Solo adultos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Duración *</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="Ej: 2h 30m" 
                  required 
                  value={form.duration || ''} 
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Estado</label>
                <select 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  value={form.status || 'NOW_PLAYING'} 
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="NOW_PLAYING">En cartelera</option>
                  <option value="PRESALE">Preventa</option>
                  <option value="UPCOMING">Próximamente</option>
                  <option value="ENDED">Finalizada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Elenco</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="Actor 1, Actor 2, Actor 3" 
                  value={form.cast || ''} 
                  onChange={e => setForm(f => ({ ...f, cast: e.target.value }))} 
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-300">Sinopsis</label>
                <textarea 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  rows={3} 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="Descripción completa de la película..." 
                  value={form.synopsis || ''} 
                  onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} 
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-300">Card Image URL</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="https://example.com/poster.jpg" 
                  value={form.cardImageUrl || ''} 
                  onChange={e => setForm(f => ({ ...f, cardImageUrl: e.target.value }))} 
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-300">Banner URL</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="https://example.com/banner.jpg" 
                  value={form.bannerUrl || ''} 
                  onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))} 
                />
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-2 text-gray-300">Trailer URL</label>
                <input 
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500" 
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }} 
                  placeholder="https://youtube.com/watch?v=..." 
                  value={form.trailerUrl || ''} 
                  onChange={e => setForm(f => ({ ...f, trailerUrl: e.target.value }))} 
                />
              </div>
              
              <div className="md:col-span-3 flex gap-3">
                <button 
                  type="submit" 
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white"
                >
                  {editing ? '✓ Actualizar' : '+ Crear Película'}
                </button>
                {editing && (
                  <button 
                    type="button" 
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" 
                    style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} 
                    onClick={() => { 
                      setEditing(null); 
                      setForm({ title: '', synopsis: '', genre: '', classification: '', duration: '', cardImageUrl: '', bannerUrl: '', trailerUrl: '', cast: '', status: 'NOW_PLAYING' }); 
                      setMessage('');
                    }}
                  >
                    ✕ Cancelar
                  </button>
                )}
                {message && (
                  <div className={`flex items-center px-4 py-3 rounded-lg ${message.includes('Error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Catálogo */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">🎞️</span>
              Catálogo ({filtered.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-12 opacity-60">Cargando películas...</div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full text-center py-12 opacity-60">No hay películas que mostrar</div>
              ) : (
                filtered.map((m: Movie & { cardImageUrl?: string; bannerUrl?: string; cast?: string[]; classification?: string; duration?: string }) => (
                  <div 
                    key={m.id} 
                    className="rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 relative" 
                    style={{ 
                      backgroundColor: 'var(--cinepal-gray-800)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {(m.cardImageUrl || m.posterUrl) && (
                      <div className="relative overflow-hidden" style={{ height: 320 }}>
                        <img 
                          src={m.cardImageUrl || m.posterUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="text-xl font-bold mb-2">{m.title}</div>
                      <div className="text-sm text-gray-400 mb-3 flex flex-wrap gap-2">
                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded">{m.genre}</span>
                        {m.duration && <span className="bg-gray-700 px-2 py-1 rounded">{m.duration}</span>}
                        {m.classification && <span className="bg-gray-700 px-2 py-1 rounded">{m.classification}</span>}
                      </div>
                      <div className="text-sm text-gray-400 line-clamp-2 mb-4">{m.synopsis}</div>
                      {m.cast && Array.isArray(m.cast) && m.cast.length > 0 && (
                        <div className="text-xs text-gray-500 mb-4">Elenco: {m.cast.slice(0, 3).join(', ')}</div>
                      )}
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105" 
                          style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }} 
                          onClick={() => onEdit(m)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 text-white" 
                          onClick={() => onDelete(m)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

export default MoviesAdmin
