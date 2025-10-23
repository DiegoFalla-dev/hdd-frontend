import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const PerfilUsuario: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    nationalId: '',
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
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
      await authService.login(loginForm);
      setIsLogged(true);
      setMessage('Login exitoso');
      navigate('/');
    } catch (err) {
      console.error('Login error', err);
  // @ts-expect-error - may be AxiosError with response
  setMessage(err?.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    // Build payload expected by backend (see RegisterRequestDto)
    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        setMessage('Las contraseñas no coinciden');
        return;
      }
      const payload = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        birthDate: registerForm.birthDate || undefined,
        nationalId: registerForm.nationalId || undefined,
        roles: ['USER'],
      };
      await authService.register(payload);
      setMessage('Registro exitoso. Por favor inicia sesión.');
      setIsRegistering(false);
    } catch (err) {
      console.error('Register error', err);
      // @ts-expect-error - err may be an AxiosError with response
      setMessage(err?.response?.data?.message || 'Error al registrar usuario');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLogged(false);
    navigate('/');
  };

  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg">
        <h2 className="text-xl mb-4">Perfil de Usuario</h2>

        {isLogged && user ? (
          <div>
            <p>Has iniciado sesión como <strong>{user.username}</strong></p>
            <p className="mt-2">Email: {user.email}</p>
            <div className="mt-4">
              <button onClick={handleLogout} className="btn">Cerrar sesión</button>
            </div>
          </div>
        ) : (
          <div>
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
                <input name="email" type="email" value={registerForm.email} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                <label className="block mb-2">Contraseña</label>
                <input name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                <label className="block mb-2">Confirmar contraseña</label>
                <input name="confirmPassword" type="password" value={registerForm.confirmPassword} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                <label className="block mb-2">Fecha de nacimiento</label>
                <input name="birthDate" type="date" value={registerForm.birthDate} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                <label className="block mb-2">DNI / Documento</label>
                <input name="nationalId" value={registerForm.nationalId} onChange={handleRegisterChange} className="w-full mb-3 p-2 bg-gray-800" />
                <button type="submit" className="btn">Registrar</button>
              </form>
            )}

            {message && <p className="mt-4 text-sm text-yellow-300">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;
