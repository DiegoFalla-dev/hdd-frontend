// Removed duplicate UsersAdmin definition to avoid identifier redeclaration
import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getAllUsers, createUser, updateUser, deleteUser, getUserPurchases, validateUserAccount, type User, type UserDTO, type UserPurchase } from '../../services/userService';

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
  const [viewingPurchaseDetail, setViewingPurchaseDetail] = useState<UserPurchase | null>(null);
  const [viewingDetails, setViewingDetails] = useState<User | null>(null);
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
        roles: form.roles,
        // username es requerido en UserDTO
        username: form.email.split('@')[0] || form.firstName.toLowerCase()
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

  const onValidateAccount = async (u: User) => {
    if (!window.confirm(`¿Estás seguro de validar la cuenta de ${u.firstName} ${u.lastName}?`)) return;
    try {
      await validateUserAccount(u.id);
      setMessage(`Cuenta de ${u.firstName} ${u.lastName} validada correctamente`);
      await load();
      if (viewingDetails?.id === u.id) {
        const updatedUser = users.find(user => user.id === u.id);
        if (updatedUser) {
          setViewingDetails({ ...updatedUser, isValid: true });
        }
      }
    } catch (error: any) {
      console.error('Error validating user account:', error);
      setMessage(error.response?.data?.message || 'Error al validar cuenta de usuario');
    }
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
                    <th className="text-left p-3">Estado</th>
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
                          <td className="p-4 text-[#E3E1E2]/80 hover:bg-white/5 transition-colors">{user.id}</td>
                          <td className="p-4 text-[#EFEFEE] font-semibold hover:bg-white/5 transition-colors">{user.firstName} {user.lastName}</td>
                          <td className="p-4 text-[#E3E1E2]/80 hover:bg-white/5 transition-colors">{user.email}</td>
                          <td className="p-4 text-[#E3E1E2]/80 hover:bg-white/5 transition-colors">{user.nationalId || '-'}</td>
                          <td className="p-3">
                            <span 
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                user.isValid 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {user.isValid ? '✓ Validada' : '⚠ Pendiente'}
                            </span>
                          </td>
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
                            <div className="flex gap-2 justify-center flex-wrap">
                              <button
                                className="px-3 py-1 rounded text-sm font-semibold"
                                style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                onClick={() => setViewingDetails(user)}
                                title="Ver detalles completos"
                              >
                                Ver
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
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{purchase.movieTitle || 'Película no disponible'}</p>
                          <p className="text-sm opacity-80">
                            {purchase.cinemaName || 'Cine no especificado'} - Sala {purchase.roomName || 'N/A'}
                          </p>
                          <p className="text-sm opacity-80">
                            Función: {purchase.showDate || 'N/A'} {purchase.showTime || ''}
                          </p>
                          {purchase.format && (
                            <p className="text-xs opacity-60 mt-1">Formato: {purchase.format.replace(/^_/, '')}</p>
                          )}
                        </div>
                        <div className="text-right min-w-fit">
                          <p className="font-bold text-xl" style={{ color: 'var(--cinepal-primary)' }}>
                            S/ {purchase.totalAmount.toFixed(2)}
                          </p>
                          {purchase.status && (
                            <p className="text-xs opacity-80 mt-1">{purchase.status}</p>
                          )}
                          <p className="text-xs opacity-60 mt-2">
                            {new Date(purchase.purchaseDate || purchase.createdAt || '').toLocaleDateString('es-PE')}
                          </p>
                          <button
                            onClick={() => setViewingPurchaseDetail(purchase)}
                            className="mt-3 px-3 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de detalles de compra */}
        {viewingPurchaseDetail && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingPurchaseDetail(null)}
          >
            <div
              className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--cinepal-gray-700)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Confirmación de Orden #{viewingPurchaseDetail.id}
                </h2>
                <button
                  className="px-4 py-2 rounded font-semibold bg-red-600 hover:bg-red-700 transition-colors"
                  onClick={() => setViewingPurchaseDetail(null)}
                >
                  Cerrar
                </button>
              </div>

              {/* Detalles de la compra */}
              <div className="space-y-4">
                {/* Película y función */}
                <div className="p-4 rounded" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h3 className="font-bold mb-3">Película y Función</h3>
                  <p className="text-sm"><strong>Película:</strong> {viewingPurchaseDetail.movieTitle}</p>
                  <p className="text-sm"><strong>Cine:</strong> {viewingPurchaseDetail.cinemaName} - Sala {viewingPurchaseDetail.roomName}</p>
                  <p className="text-sm"><strong>Formato:</strong> {viewingPurchaseDetail.format?.replace(/^_/, '')}</p>
                  <p className="text-sm"><strong>Fecha de función:</strong> {viewingPurchaseDetail.showDate} {viewingPurchaseDetail.showTime}</p>
                </div>

                {/* Entradas */}
                {viewingPurchaseDetail.orderItems && viewingPurchaseDetail.orderItems.length > 0 && (
                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                    <h3 className="font-bold mb-3">Entradas</h3>
                    <div className="space-y-2">
                      {viewingPurchaseDetail.orderItems.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm">
                          {idx + 1}. Asiento {item.seat?.code || 'N/A'} - S/ {item.price?.toFixed(2) || '0.00'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dulcería */}
                {viewingPurchaseDetail.orderConcessions && viewingPurchaseDetail.orderConcessions.length > 0 && (
                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                    <h3 className="font-bold mb-3">Dulcería y Bebidas</h3>
                    <div className="space-y-2">
                      {viewingPurchaseDetail.orderConcessions.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm">
                          {idx + 1}. {item.productName} x{item.quantity} - S/ {item.totalPrice?.toFixed(2) || '0.00'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totales */}
                <div className="p-4 rounded border-t" style={{ backgroundColor: 'var(--cinepal-gray-800)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="text-sm"><strong>Subtotal:</strong> S/ {(viewingPurchaseDetail.totalAmount - (viewingPurchaseDetail.discountAmount || 0) - (viewingPurchaseDetail.fidelityDiscountAmount || 0)).toFixed(2)}</p>
                  {(viewingPurchaseDetail.discountAmount || 0) > 0 && (
                    <p className="text-sm text-green-400"><strong>Descuento Promoción:</strong> - S/ {viewingPurchaseDetail.discountAmount?.toFixed(2)}</p>
                  )}
                  {(viewingPurchaseDetail.fidelityDiscountAmount || 0) > 0 && (
                    <p className="text-sm text-green-400"><strong>Descuento Fidelización:</strong> - S/ {viewingPurchaseDetail.fidelityDiscountAmount?.toFixed(2)}</p>
                  )}
                  <p className="text-lg font-bold mt-2"><strong>Total:</strong> S/ {viewingPurchaseDetail.totalAmount.toFixed(2)}</p>
                </div>

                {/* Estado y fecha */}
                <div className="p-4 rounded" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <p className="text-sm"><strong>Estado:</strong> {viewingPurchaseDetail.status || 'COMPLETED'}</p>
                  <p className="text-sm"><strong>Fecha de compra:</strong> {new Date(viewingPurchaseDetail.purchaseDate || viewingPurchaseDetail.createdAt || '').toLocaleString('es-PE')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles del usuario */}
        {viewingDetails && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingDetails(null)}
          >
            <div
              className="rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--cinepal-gray-700)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit pb-4 border-b" style={{ borderColor: 'var(--cinepal-gray-600)' }}>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <span className="text-3xl">👤</span>
                  Detalles Completos del Usuario
                </h2>
                <button
                  className="px-4 py-2 rounded font-semibold hover:scale-105 transition-transform"
                  style={{ backgroundColor: 'var(--cinepal-gray-600)', color: 'var(--cinepal-bg-100)' }}
                  onClick={() => setViewingDetails(null)}
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar y nombre */}
                <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  {viewingDetails.avatar ? (
                    <img 
                      src={viewingDetails.avatar} 
                      alt={`${viewingDetails.firstName} ${viewingDetails.lastName}`}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-4xl font-bold">
                      {viewingDetails.firstName?.[0]}{viewingDetails.lastName?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold">{viewingDetails.firstName} {viewingDetails.lastName}</h3>
                    <p className="text-gray-400 text-lg">@{viewingDetails.username || 'sin_usuario'}</p>
                    <p className="text-gray-400">ID: {viewingDetails.id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span 
                      className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${
                        viewingDetails.isValid 
                          ? 'bg-green-500/20 text-green-300 border border-green-500' 
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500'
                      }`}
                    >
                      {viewingDetails.isValid ? '✓ VALIDADA' : '⚠ PENDIENTE'}
                    </span>
                    <span 
                      className={`px-4 py-2 rounded-lg text-sm font-bold text-center ${
                        viewingDetails.isActive 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500' 
                          : 'bg-red-500/20 text-red-300 border border-red-500'
                      }`}
                    >
                      {viewingDetails.isActive ? '✓ ACTIVA' : '✕ INACTIVA'}
                    </span>
                  </div>
                </div>

                {/* Información personal */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📋</span> Información Personal
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="font-semibold text-blue-300">{viewingDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">DNI / Cédula</p>
                      <p className="font-semibold">{viewingDetails.nationalId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Género</p>
                      <p className="font-semibold">{viewingDetails.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Fecha de Nacimiento</p>
                      <p className="font-semibold">{viewingDetails.birthDate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Nombre de Usuario</p>
                      <p className="font-semibold">@{viewingDetails.username || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Cine Favorito</p>
                      {viewingDetails.favoriteCinema?.name ? (
                        <>
                          <p className="font-semibold">{viewingDetails.favoriteCinema.name}</p>
                          {viewingDetails.favoriteCinema.city && (
                            <p className="text-xs text-gray-500">{viewingDetails.favoriteCinema.city}</p>
                          )}
                        </>
                      ) : (
                        <p className="font-semibold">—</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Facturación */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📄</span> Información de Facturación
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">RUC</p>
                      <p className="font-semibold">{viewingDetails.ruc || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Razón Social</p>
                      <p className="font-semibold">{viewingDetails.razonSocial || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Fidelización */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>⭐</span> Información de Fidelización
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Puntos Acumulados</p>
                      <p className="font-bold text-2xl text-yellow-400">{viewingDetails.fidelityPoints || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Última Compra</p>
                      <p className="font-semibold">
                        {viewingDetails.lastPurchaseDate 
                          ? new Date(viewingDetails.lastPurchaseDate).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Roles y Permisos */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>🔐</span> Roles y Permisos
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {Array.isArray(viewingDetails.roles) && viewingDetails.roles.map(role => (
                      <span
                        key={role}
                        className="px-4 py-2 rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: role === 'ROLE_ADMIN' ? 'var(--cinepal-primary)' : role === 'ROLE_MANAGER' ? 'var(--cinepal-primary-700)' : 'var(--cinepal-gray-600)',
                          color: 'var(--cinepal-bg-100)'
                        }}
                      >
                        {formatRole(role)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Información de Seguridad */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--cinepal-gray-800)' }}>
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>🛡️</span> Información de Seguridad
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Estado de Validación</p>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${viewingDetails.isValid ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {viewingDetails.isValid ? '✓ Validada' : '⚠ Pendiente'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Dos Factores (2FA)</p>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${viewingDetails.isTwoFactorEnabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                        {viewingDetails.isTwoFactorEnabled ? '✓ Habilitado' : '✕ Deshabilitado'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Token Activación Expira</p>
                      <p className="font-semibold text-sm">
                        {viewingDetails.activationTokenExpiry 
                          ? new Date(viewingDetails.activationTokenExpiry).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de validar cuenta */}
                {!viewingDetails.isValid && (
                  <div className="p-4 rounded-lg border-2" style={{ 
                    backgroundColor: viewingDetails.ruc && viewingDetails.razonSocial ? 'rgba(220, 38, 38, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    borderColor: viewingDetails.ruc && viewingDetails.razonSocial ? 'var(--cinepal-primary)' : '#ef4444' 
                  }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        {viewingDetails.ruc && viewingDetails.razonSocial ? (
                          <>
                            <h4 className="text-lg font-bold mb-1">✓ Cuenta Lista para Validar</h4>
                            <p className="text-sm text-gray-400">Esta cuenta tiene RUC y Razón Social. Puede ser validada para facturación.</p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-lg font-bold mb-1">⚠ Información Incompleta</h4>
                            <p className="text-sm text-gray-400">
                              {!viewingDetails.ruc && !viewingDetails.razonSocial 
                                ? 'Falta RUC y Razón Social para validar esta cuenta'
                                : !viewingDetails.ruc
                                ? 'Falta RUC para validar esta cuenta'
                                : 'Falta Razón Social para validar esta cuenta'}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        disabled={!viewingDetails.ruc || !viewingDetails.razonSocial}
                        className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-transform ${
                          viewingDetails.ruc && viewingDetails.razonSocial
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:scale-105 cursor-pointer'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => {
                          if (viewingDetails.ruc && viewingDetails.razonSocial) {
                            onValidateAccount(viewingDetails);
                          }
                        }}
                      >
                        {viewingDetails.ruc && viewingDetails.razonSocial ? '✓ Validar Cuenta Ahora' : '✗ No puede validarse'}
                      </button>
                    </div>
                  </div>
                )}

                {viewingDetails.isValid && (
                  <div className="p-4 rounded-lg border-2" style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                    borderColor: '#22c55e' 
                  }}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">✓</span>
                      <div>
                        <h4 className="text-lg font-bold text-green-300">Cuenta Validada</h4>
                        <p className="text-sm text-gray-400">Esta cuenta ha sido validada y está completamente activa</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-3 pt-4 border-t flex-wrap" style={{ borderColor: 'var(--cinepal-gray-600)' }}>
                  <button
                    className="flex-1 min-w-[200px] px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                    style={{ backgroundColor: 'var(--cinepal-primary-700)', color: 'var(--cinepal-bg-100)' }}
                    onClick={() => {
                      setViewingDetails(null);
                      onViewPurchases(viewingDetails);
                    }}
                  >
                    📦 Ver Historial de Compras
                  </button>
                  <button
                    className="flex-1 min-w-[200px] px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
                    style={{ backgroundColor: 'var(--cinepal-bg-200)', color: 'var(--cinepal-gray-900)' }}
                    onClick={() => {
                      setViewingDetails(null);
                      onEdit(viewingDetails);
                    }}
                  >
                    ✏️ Editar Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
