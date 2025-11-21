import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form });
      navigate('/login');
    } catch (err) {
      setError('Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-md mx-auto p-6 bg-neutral-900 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Registro</h1>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">Nombre</label>
              <input name="firstName" value={form.firstName} onChange={onChange} required className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Apellido</label>
              <input name="lastName" value={form.lastName} onChange={onChange} required className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1 text-sm">Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none" />
          </div>
            <div>
            <label className="block mb-1 text-sm">Confirmar Contraseña</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} required className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-red-700 hover:bg-red-600 transition disabled:opacity-50">
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-400">¿Ya tienes cuenta? <Link to="/login" className="text-red-400 hover:underline">Inicia sesión</Link></p>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
