import React, { useEffect, useState } from 'react';
import userAuthService from '../services/userAuthService';
import { useNavigate } from 'react-router-dom';
import CuentaPanel from '../components/CuentaPanel';

const PerfilUsuario: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'cuenta' | null>(null);

  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const user = userAuthService.getStoredUser();
    setIsLogged(Boolean(user));
  }, []);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
  await userAuthService.login(loginForm);
      setIsLogged(true);
      setMessage('Login exitoso');
      // navigate to home or refresh
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      setMessage(err?.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    try {
      const payload = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
      };
      await userAuthService.register(payload);
      setMessage('Registro exitoso. Por favor inicia sesión.');
      setIsRegistering(false);
    } catch (err: any) {
      console.error('Register error', err);
      setMessage(err?.response?.data?.message || 'Error al registrar usuario');
    }
  };

  const handleLogout = () => {
    userAuthService.logout();
    setIsLogged(false);
    navigate('/');
  };

  const user = userAuthService.getStoredUser();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        {/* Modal-like card */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-2xl font-extrabold">Perfil</h3>
            <button onClick={() => navigate('/')} className="bg-gray-800 rounded p-2">✕</button>
          </div>

          {isLogged && user ? (
            <div className="mt-4">
              <h1 className="text-4xl font-extrabold tracking-tight">HOLA, {user.username?.toUpperCase() ?? ''}</h1>

              <div className="mt-6 flex flex-col items-center">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full bg-gray-700 flex items-center justify-center text-6xl">👤</div>
                  <button className="absolute -right-2 -bottom-2 bg-gray-800 p-2 rounded-full">✎</button>
                </div>

                {activePanel === 'cuenta' ? (
                  <CuentaPanel onClose={() => setActivePanel(null)} />
                ) : (
                  <div className="w-full mt-4 grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/compras')} className="p-4 bg-gray-800 rounded">COMPRAS</button>
                    <button onClick={() => setActivePanel('cuenta')} className="p-4 bg-gray-800 rounded">CUENTA</button>
                    <button onClick={() => navigate('/metodos-pago')} className="p-4 bg-gray-800 rounded">METODOS DE PAGO</button>
                    <button onClick={() => navigate('/escribenos')} className="p-4 bg-gray-800 rounded">ESCRÍBENOS</button>
                  </div>
                )}

                <div className="mt-4 w-full text-left">
                  <button onClick={handleLogout} className="text-sm text-gray-400">Cerrar sesión</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-4">
                <button onClick={() => setIsRegistering(false)} className={`mr-2 btn ${!isRegistering ? 'active' : ''}`}>Iniciar sesión</button>
                <button onClick={() => setIsRegistering(true)} className={`btn ${isRegistering ? 'active' : ''}`}>Registrarse</button>
              </div>

              {!isRegistering ? (
                <form onSubmit={submitLogin}>
                  <label className="block mb-2">Usuario o correo</label>
                  <input name="usernameOrEmail" value={loginForm.usernameOrEmail} onChange={handleLoginChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <label className="block mb-2">Contraseña</label>
                  <input name="password" type="password" value={loginForm.password} onChange={handleLoginChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <button type="submit" className="btn">Entrar</button>
                </form>
              ) : (
                <form onSubmit={submitRegister}>
                  <label className="block mb-2">Nombre</label>
                  <input name="firstName" value={registerForm.firstName} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <label className="block mb-2">Apellido</label>
                  <input name="lastName" value={registerForm.lastName} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <label className="block mb-2">Correo</label>
                  <input name="email" value={registerForm.email} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <label className="block mb-2">Contraseña</label>
                  <input name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <label className="block mb-2">Confirmar contraseña</label>
                  <input name="confirmPassword" type="password" value={registerForm.confirmPassword} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                  <button type="submit" className="btn">Registrar</button>
                </form>
              )}

              {message && <p className="mt-4 text-sm text-yellow-300">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;
