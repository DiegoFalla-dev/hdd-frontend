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
    <div className="min-h-screen text-white pt-16" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />
      <main className="flex items-center justify-center px-4 py-16 animate-fade-in">
        <div className="max-w-md w-full">
          {/* Card elegante con glass effect */}
          <div className="card-glass p-8 animate-scale-in">
            {/* Header con icono */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Iniciar sesión
              </h1>
              <p className="text-neutral-400 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {/* Error message mejorado */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-up">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-400 text-sm font-semibold">{error}</span>
                </div>
              </div>
            )}

            {/* Form con efectos modernos */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">
                  Usuario o Email
                </label>
                <input
                  type="text"
                  value={emailOrUser}
                  onChange={e => setEmailOrUser(e.target.value)}
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all duration-300"
                  placeholder="Ingresa tu usuario o email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all duration-300"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-gradient btn-shine w-full py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>

            {/* Footer del card */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-center text-sm text-neutral-400">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-[#BB2228] hover:text-[#D42730] font-semibold transition-colors">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>

          {/* Decoración adicional */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            © 2024 CinePlus. Todos los derechos reservados.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
