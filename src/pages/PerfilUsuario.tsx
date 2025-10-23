import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

type LoginForm = {
  usernameOrEmail: string;
  password: string;
};

type RegisterForm = {
  username: string;
  email: string;
  password: string;
};

const PerfilUsuario: React.FC = () => {
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ usernameOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ token?: string; id?: number; username?: string; email?: string; roles?: string[] } | null>(null);

  // Minimal shape for Axios error responses to avoid using `any`
  type AxiosLikeError = {
    response?: {
      data?: unknown;
      status?: number;
    };
    message?: string;
  };

  const getMessageFromResponseData = (data: unknown): string | undefined => {
    if (!data) return undefined;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      const d = data as { message?: string } | Record<string, unknown>;
  const dd = d as { message?: unknown };
  if ('message' in d && typeof dd.message === 'string') return dd.message;
      // fallback to JSON string
      try {
        return JSON.stringify(d);
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, loginForm);
      // Backend devuelve JwtResponseDto con token, id, username, email, roles
      const data = res.data;
      const usuario = {
        token: data.token,
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
        type: data.type || 'Bearer'
      };
      localStorage.setItem('token', `${usuario.type} ${usuario.token}`);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      setUser(usuario);
      navigate('/');
    } catch (err) {
      console.error(err);
      // intento tipado para AxiosError sin importar import
  const ae = err as AxiosLikeError;
  const fromData = getMessageFromResponseData(ae?.response?.data);
  const message = fromData || ae.message || 'Error al iniciar sesión';
      setError(message);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      await axios.post(`${API_BASE}/api/auth/register`, registerForm);
      // Auto switch to login after successful register
      setIsRegistering(false);
      setRegisterForm({ username: '', email: '', password: '' });
      setError('Registro exitoso. Puedes iniciar sesión.');
    } catch (err) {
      console.error(err);
  const ae2 = err as AxiosLikeError;
  const fromData2 = getMessageFromResponseData(ae2?.response?.data);
  const message = fromData2 || ae2.message || 'Error en el registro';
      setError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white px-4 py-8">
        <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-md">
          {!user ? (
            <>
              <h2 className="text-2xl mb-4">{isRegistering ? 'Registro' : 'Iniciar sesión'}</h2>
              {error && <div className="mb-4 text-red-400">{error}</div>}

              {isRegistering ? (
                <form onSubmit={handleRegister} className="space-y-3">
                  <input required placeholder="Usuario" value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} className="w-full p-2 bg-black border border-gray-700 rounded" />
                  <input required type="email" placeholder="email@dominio" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} className="w-full p-2 bg-black border border-gray-700 rounded" />
                  <input required type="password" placeholder="Contraseña" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} className="w-full p-2 bg-black border border-gray-700 rounded" />
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 rounded">Registrar</button>
                    <button type="button" onClick={() => setIsRegistering(false)} className="px-4 py-2 bg-gray-700 rounded">Volver</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input required placeholder="Usuario o email" value={loginForm.usernameOrEmail} onChange={e => setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })} className="w-full p-2 bg-black border border-gray-700 rounded" />
                  <input required type="password" placeholder="Contraseña" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full p-2 bg-black border border-gray-700 rounded" />
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Entrar</button>
                    <button type="button" onClick={() => setIsRegistering(true)} className="px-4 py-2 bg-gray-700 rounded">Crear cuenta</button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-2xl">Bienvenido, {user.username}</h2>
              <p className="text-sm text-gray-300">{user.email}</p>
              <div className="mt-4">
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded">Cerrar sesión</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PerfilUsuario;
