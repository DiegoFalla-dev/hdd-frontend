import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { queryClient } from '../lib/queryClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ usernameOrEmail: emailOrUser, password });
      // Prefetch métodos de pago y perfil (nombre) tras login
      queryClient.prefetchQuery({ queryKey: ['paymentMethods'] });
      // Si existiera endpoint de perfil detallado: queryClient.prefetchQuery({ queryKey: ['profile'] , queryFn: ... })
      navigate(from, { replace: true });
    } catch (err) {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-md mx-auto p-6 bg-neutral-900 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Usuario o Email</label>
            <input
              type="text"
              value={emailOrUser}
              onChange={e => setEmailOrUser(e.target.value)}
              className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-neutral-800 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-red-700 hover:bg-red-600 transition disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-400">
          ¿No tienes cuenta? <Link to="/register" className="text-red-400 hover:underline">Regístrate</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
