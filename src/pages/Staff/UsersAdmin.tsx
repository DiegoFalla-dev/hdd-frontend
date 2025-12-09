import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllUsers, createUser, updateUser, deleteUser, getUserPurchases, type User, type UserDTO, type UserPurchase } from '../../services/userService';

interface UserForm {
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  birthDate: string;
  avatar?: string;
  roles: string[];
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [q, setQ] = useState<string>('');
  const [editing, setEditing] = useState<User | null>(null);
  const [viewingPurchases, setViewingPurchases] = useState<{ user: User; purchases: UserPurchase[] } | null>(null);
  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    nationalId: '',
    email: '',
    birthDate: '',
    avatar: '',
    roles: ['ROLE_USER']
  });
  const [message, setMessage] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u => 
      (u.firstName || '').toLowerCase().includes(term) || 
      (u.lastName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.nationalId || '').toLowerCase().includes(term)
    );
  }, [q, users]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Validaciones
    if (!form.firstName.trim()) {
      setMessage('El nombre es requerido');
      return;
    }
    if (!form.lastName.trim()) {
      setMessage('El apellido es requerido');
      return;
    }
    if (!form.nationalId.trim()) {
      setMessage('El DNI/Cédula es requerido');
      return;
    }
    if (!form.email.trim()) {
      setMessage('El email es requerido');
      return;
    }
    if (!form.birthDate.trim()) {
      setMessage('La fecha de nacimiento es requerida');
      return;
    }

    try {
      const payload: UserDTO = {
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,
        email: form.email,
        birthDate: form.birthDate,
        avatar: form.avatar || null,
        roles: form.roles
      };

      if (editing?.id) {
        await updateUser(editing.id, payload);
        setMessage('Usuario actualizado correctamente');
      } else {
        await createUser(payload);
        setMessage('Usuario creado correctamente con contraseña temporal: TempPass123!');
      }

      setForm({
        firstName: '',
        lastName: '',
        nationalId: '',
        email: '',
        birthDate: '',
        avatar: '',
        roles: ['ROLE_USER']
      });
      setEditing(null);
      await load();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setMessage(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const onEdit = (u: User) => {
    setEditing(u);
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      nationalId: u.nationalId || '',
      email: u.email || '',
      birthDate: u.birthDate || '',
      avatar: u.avatar || '',
      roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : ['ROLE_USER']
    });
    setMessage('');
  };

  const onDelete = async (u: User) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${u.firstName} ${u.lastName}?`)) return;
    try {
      await deleteUser(u.id);
      setMessage('Usuario eliminado correctamente');
      await load();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const onViewPurchases = async (u: User) => {
    try {
      const purchases = await getUserPurchases(u.id);
      setViewingPurchases({ user: u, purchases });
    } catch (error) {
      console.error('Error loading purchases:', error);
      setMessage('Error al cargar el historial de compras');
    }
  };

  const onCancel = () => {
    setEditing(null);
    setForm({
      firstName: '',
      lastName: '',
      nationalId: '',
      email: '',
      birthDate: '',
      avatar: '',
      roles: ['ROLE_USER']
    });
    setMessage('');
  };

  const toggleRole = (role: string) => {
    setForm(f => {
      const hasRole = f.roles.includes(role);
      if (hasRole) {
        // No permitir quitar el último rol
        if (f.roles.length === 1) return f;
        return { ...f, roles: f.roles.filter(r => r !== role) };
      } else {
        return { ...f, roles: [...f.roles, role] };
      }
    });
  };

  // Helper para formatear roles (quitar ROLE_ prefix)
  const formatRole = (role: string) => {
    return role.replace('ROLE_', '');
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
              <div className="text-5xl">👥</div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-400 mt-1">Administra usuarios del sistema</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto -mt-8">

          {/* Formulario de crear/editar */}
          <div className="rounded-xl p-8 mb-8 relative overflow-hidden" style={{ 
            backgroundColor: 'var(--cinepal-gray-800)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-pink-600" />
            
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">{editing ? '✏️' : '➕'}</span>
              {editing ? 'Editar Usuario' : 'Crear Usuario'}
            </h2>
            
            {!editing && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                <p className="text-sm text-red-300"><strong>Nota:</strong> El usuario se creará con contraseña temporal: <strong className="text-red-400">TempPass123!</strong></p>
              </div>
            )}

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Nombre *</label>
                <input
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  placeholder="Nombre"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Apellido *</label>
                <input
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  placeholder="Apellido"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">DNI / Cédula *</label>
                <input
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  placeholder="12345678"
                  value={form.nationalId}
                  onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))}
                  disabled={!!editing}
                  required
                />
                {editing && <small className="text-gray-500 text-xs mt-1">El DNI no puede ser modificado</small>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email *</label>
                <input
                  type="email"
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  placeholder="email@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  value={form.birthDate}
                  onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Avatar URL (opcional)</label>
                <input
                  type="text"
                  className="p-3 rounded-lg w-full transition-all focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)', border: 'none' }}
                  placeholder="https://..."
                  value={form.avatar}
                  onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-3 text-gray-300">Roles *</label>
                <div className="flex gap-6 items-center">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.roles.includes('ROLE_USER')}
                      onChange={() => toggleRole('ROLE_USER')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="group-hover:text-red-400 transition-colors">{formatRole('ROLE_USER')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.roles.includes('ROLE_MANAGER')}
                      onChange={() => toggleRole('ROLE_MANAGER')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="group-hover:text-red-400 transition-colors">{formatRole('ROLE_MANAGER')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.roles.includes('ROLE_ADMIN')}
                      onChange={() => toggleRole('ROLE_ADMIN')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="group-hover:text-red-400 transition-colors">{formatRole('ROLE_ADMIN')}</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-pink-600 text-white"
                >
                  {editing ? '✓ Actualizar' : '+ Crear Usuario'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--cinepal-gray-700)', color: 'var(--cinepal-bg-100)' }}
                  >
                    ✕ Cancelar
                  </button>
                )}
                {message && (
                  <div className={`flex items-center px-4 py-3 rounded-lg ${message.includes('Error') || message.includes('requerido') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {message}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Buscador */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, apellido, email o DNI..."
              className="p-4 rounded-xl w-full md:w-96 text-lg transition-all focus:ring-2 focus:ring-red-500"
              style={{ backgroundColor: 'var(--cinepal-gray-800)', color: 'var(--cinepal-bg-100)', border: 'none' }}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          {/* Tabla de usuarios */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              Lista de Usuarios ({filtered.length})
            </h2>
            
            <div className="rounded-xl overflow-hidden" style={{ 
              backgroundColor: 'var(--cinepal-gray-800)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Nombre</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">DNI</th>
                    <th className="text-left p-3">Fecha Nacimiento</th>
                    <th className="text-left p-3">Roles</th>
                    <th className="text-center p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8">Cargando usuarios...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8">
                        {q ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(user => {
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--cinepal-gray-600)' }}>
                          <td className="p-3">{user.id}</td>
                          <td className="p-3">{user.firstName} {user.lastName}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">{user.nationalId || '-'}</td>
                          <td className="p-3">{user.birthDate || '-'}</td>
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap">
                              {Array.isArray(user.roles) && user.roles.map(role => (
                                <span
                                  key={role}
                                  className="px-2 py-1 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: role === 'ROLE_ADMIN' ? 'var(--cinepal-primary)' : role === 'ROLE_MANAGER' ? 'var(--cinepal-primary-700)' : 'var(--cinepal-gray-600)',
                                    color: 'var(--cinepal-bg-100)'
                                  }}
                                >
                                  {formatRole(role)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="px-3 py-1 rounded text-sm font-semibold"
                                style={{ backgroundColor: 'var(--cinepal-primary-700)', color: 'var(--cinepal-bg-100)' }}
                                onClick={() => onViewPurchases(user)}
                              >
                                Compras
                              </button>
                              <button
                                className="px-3 py-1 rounded text-sm font-semibold"
                                style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }}
                                onClick={() => onEdit(user)}
                              >
                                Editar
                              </button>
                              <button
                                className="px-3 py-1 rounded text-sm font-semibold"
                                style={{ backgroundColor: '#dc2626', color: 'white' }}
                                onClick={() => onDelete(user)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            Total de usuarios: {filtered.length} {q && `de ${users.length}`}
          </div>
          </div>
        </div>

        {/* Modal de historial de compras */}
        {viewingPurchases && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingPurchases(null)}
          >
            <div
              className="rounded p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--cinepal-gray-700)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Historial de Compras - {viewingPurchases.user.firstName} {viewingPurchases.user.lastName}
                </h2>
                <button
                  className="px-4 py-2 rounded font-semibold"
                  style={{ backgroundColor: 'var(--cinepal-gray-600)', color: 'var(--cinepal-bg-100)' }}
                  onClick={() => setViewingPurchases(null)}
                >
                  Cerrar
                </button>
              </div>

              {viewingPurchases.purchases.length === 0 ? (
                <p className="text-center py-8 opacity-80">Este usuario no tiene compras registradas</p>
              ) : (
                <div className="space-y-3">
                  {viewingPurchases.purchases.map(purchase => (
                    <div
                      key={purchase.id}
                      className="p-4 rounded"
                      style={{ backgroundColor: 'var(--cinepal-gray-800)' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{purchase.movieTitle || 'Película sin título'}</p>
                          <p className="text-sm opacity-80">{purchase.cinemaName || 'Cine no especificado'}</p>
                          <p className="text-sm opacity-80">
                            {new Date(purchase.createdAt).toLocaleDateString('es-PE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl" style={{ color: 'var(--cinepal-primary)' }}>
                            S/ {purchase.totalAmount.toFixed(2)}
                          </p>
                          {purchase.status && (
                            <p className="text-sm opacity-80">{purchase.status}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
