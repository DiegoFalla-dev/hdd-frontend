import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllCinemas } from '../../services/cinemaService';
import { fetchAllMovies } from '../../services/moviesService';
import api from '../../services/apiClient';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [moviesCount, setMoviesCount] = useState<number>(0);
  const [cinemasCount, setCinemasCount] = useState<number>(0);
  const [showtimesCount, setShowtimesCount] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF' | 'USER',
  });
  const [createMsg, setCreateMsg] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        // Obtener datos directamente de los endpoints existentes
        const [movies, cinemas] = await Promise.all([
          fetchAllMovies(),
          getAllCinemas()
        ]);
        
        setMoviesCount(Array.isArray(movies) ? movies.length : 0);
        setCinemasCount(Array.isArray(cinemas) ? cinemas.length : 0);
        
        // Para showtimes, obtener todos los showtimes de todos los cines
        try {
          const showtimesPromises = cinemas.map(cinema => 
            api.get(`/showtimes?cinema=${cinema.id}`).catch(() => ({ data: [] }))
          );
          const showtimesResponses = await Promise.all(showtimesPromises);
          const totalShowtimes = showtimesResponses.reduce((sum, resp) => {
            const data = Array.isArray(resp.data) ? resp.data : [];
            return sum + data.length;
          }, 0);
          setShowtimesCount(totalShowtimes);
        } catch (showtimeError) {
          console.error('Error loading showtimes:', showtimeError);
          setShowtimesCount(0);
        }
      } catch (e) {
        console.error('Error loading stats:', e);
        // En caso de error, mantenemos los contadores en 0
        setMoviesCount(0);
        setCinemasCount(0);
        setShowtimesCount(0);
      }
    };
    load();
  }, []);

  const canSeeCreateUser = Array.isArray(user?.roles) && user.roles.includes('ADMIN');

  const onQuickCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      await authService.register({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        roles: [createForm.role],
      });
      setCreateMsg('Usuario creado correctamente');
      setCreating(false);
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'STAFF' });
    } catch (err: any) {
      setCreateMsg('Error al crear usuario');
    }
  };
  return (
    <ProtectedRoute roles={["STAFF", "ADMIN"]}>
      <div style={{ background: "var(--cinepal-gray-900)", color: "var(--cinepal-bg-100)" }} className="min-h-screen pt-16">
        <Navbar variant="dark" />
        <div className="p-8 max-w-5xl mx-auto pt-6">
          <h1 className="text-3xl font-bold mb-6">Panel de Staff</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
              <div className="text-sm opacity-80">Películas</div>
              <div className="text-2xl font-bold">{moviesCount}</div>
            </div>
            <div className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
              <div className="text-sm opacity-80">Cines</div>
              <div className="text-2xl font-bold">{cinemasCount}</div>
            </div>
            <div className="rounded p-4" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
              <div className="text-sm opacity-80">Funciones</div>
              <div className="text-2xl font-bold">{showtimesCount}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="movies" className="rounded p-6" style={{ backgroundColor: "var(--cinepal-gray-700)" }}>Gestionar Películas</Link>
            <Link to="theaters" className="rounded p-6" style={{ backgroundColor: "var(--cinepal-gray-700)" }}>Gestionar Salas</Link>
            <Link to="showtimes" className="rounded p-6" style={{ backgroundColor: "var(--cinepal-gray-700)" }}>Gestionar Funciones</Link>
          </div>

          {canSeeCreateUser && (
            <div className="mt-8 rounded p-6" style={{ backgroundColor: 'var(--cinepal-gray-700)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Creación rápida de usuario</h2>
                <button className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }} onClick={() => setCreating(v => !v)}>
                  {creating ? 'Cerrar' : 'Crear usuario'}
                </button>
              </div>
              {creating && (
                <form onSubmit={onQuickCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Juan" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Apellido *</label>
                    <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: Pérez" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: usuario@ejemplo.com" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol *</label>
                    <select className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as any }))}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="USER">USER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña *</label>
                    <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: contraseña123" type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirmar contraseña *</label>
                    <input className="p-2 rounded w-full" style={{ backgroundColor: 'var(--cinepal-bg-100)', color: 'var(--cinepal-gray-900)' }} placeholder="Ej: contraseña123" type="password" value={createForm.confirmPassword} onChange={e => setCreateForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="px-4 py-2 rounded" style={{ backgroundColor: 'var(--cinepal-primary)', color: 'var(--cinepal-bg-100)' }}>Crear</button>
                    {createMsg && <span className="px-2 py-2 text-sm opacity-80">{createMsg}</span>}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
