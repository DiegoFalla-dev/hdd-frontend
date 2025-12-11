import React, { useState, useEffect } from 'react';
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
    confirmPassword: '',
    favoriteCinema: ''
  });
  const [loading, setLoading] = useState(false);
  const [cinemas, setCinemas] = useState<{ id: number; name: string }[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await fetch('/api/cinemas');
        if (!mounted) return;
        const data = await resp.json();
        setCinemas(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingCinemas(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      // include favoriteCinema if present in localStorage (selection from cine modal) or empty
      const selectedCine = localStorage.getItem('selectedCine');
      const favoriteCinema = selectedCine ? JSON.parse(selectedCine).id ?? JSON.parse(selectedCine).name ?? '' : '';
      await register({ ...form, favoriteCinema });
      navigate('/login');
    } catch {
      setError('Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white pt-16" style={{ background: 'linear-gradient(180deg, #141113 0%, #0b0b0b 100%)' }}>
      <Navbar />
      <main className="flex items-center justify-center px-4 py-16 animate-fade-in">
        <div className="max-w-lg w-full">
          {/* Card elegante */}
          <div className="card-glass p-8 animate-scale-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#BB2228] to-[#8B191E] mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Crear Cuenta
              </h1>
              <p className="text-neutral-400 text-sm">Únete a CinePlus y disfruta del mejor cine</p>
            </div>

            {/* Error message */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-300">Nombre</label>
                  <input 
                    name="firstName" 
                    value={form.firstName} 
                    onChange={onChange} 
                    required 
                    className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-neutral-300">Apellido</label>
                  <input 
                    name="lastName" 
                    value={form.lastName} 
                    onChange={onChange} 
                    required 
                    className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={onChange} 
                  required 
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">Contraseña</label>
                <input 
                  type="password" 
                  name="password" 
                  value={form.password} 
                  onChange={onChange} 
                  required 
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={form.confirmPassword} 
                  onChange={onChange} 
                  required 
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                  placeholder="Repite tu contraseña"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-300">
                  Cine Favorito <span className="text-neutral-500 font-normal">(opcional)</span>
                </label>
                <select 
                  name="favoriteCinema" 
                  value={form.favoriteCinema || ''} 
                  onChange={(e) => setForm(f => ({ ...f, favoriteCinema: e.target.value }))} 
                  className="input-focus-glow w-full px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700 focus:border-[#BB2228] transition-all"
                >
                  <option value="">Selecciona un cine</option>
                  {loadingCinemas ? (
                    <option>Cargando...</option>
                  ) : (
                    cinemas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary-gradient btn-shine w-full py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  'Registrarme'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-center text-sm text-neutral-400">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-[#BB2228] hover:text-[#D42730] font-semibold transition-colors">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            © 2024 CinePlus. Todos los derechos reservados.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
