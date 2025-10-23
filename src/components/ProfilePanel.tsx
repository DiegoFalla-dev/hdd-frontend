import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService, { type LoginRequest, type JwtResponse, type RegisterRequest } from '../services/authService';
import './ProfilePanel.css';
import { getAllCinemas } from '../services/cinemaService';
import type { Cinema } from '../types/Cinema';

import {
  FaUserCircle, FaEdit, FaShoppingBag, FaUser, FaCreditCard, FaEnvelope, FaTimes, FaEye, FaEyeSlash,
  FaArrowLeft, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaGenderless // Nuevos iconos para la vista de Cuenta
} from 'react-icons/fa';

// --- Definición de Vistas ---
type ActiveView = 'mainProfile' | 'account' | 'purchases' | 'payment' | 'contact' | 'login' | 'register';

const ProfilePanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<JwtResponse | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('login'); // Estado para la vista activa

  // Estados para el formulario de Login
  const [loginForm, setLoginForm] = useState<LoginRequest>({ usernameOrEmail: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estados para el formulario de Registro
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    nationalId: '',
    phoneNumber: '',
    gender: '', // Usaremos un select
    favoriteCinema: '', // Usaremos un select
    contactPreference: false,
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // --- NUEVOS ESTADOS PARA LOS CINES ---
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [errorCinemas, setErrorCinemas] = useState<string | null>(null);


  // --- Inicialización y manejo de sesión ---
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUserData(user);
      setActiveView('mainProfile'); // Si está logueado, muestra la vista principal del perfil
    } else {
      setIsLoggedIn(false);
      setCurrentUserData(null);
      setActiveView('login'); // Si no, muestra el login
    }
  }, []);

  // --- NUEVO useEffect para cargar los cines ---
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        console.log('Fetching cinemas for registration form...');
        const data = await getAllCinemas();
        console.log('Cinemas fetched:', data);
        setCinemas(data);
      } catch (error) {
        console.error('Error al cargar los cines para el registro:', error);
        setErrorCinemas('No se pudieron cargar los cines.');
      } finally {
        setLoadingCinemas(false);
      }
    };

    fetchCinemas();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // --- Datos del usuario para el perfil ---
  const [avatarPreview, setAvatarPreview] = useState<string | null>((currentUserData && (currentUserData['avatar'] as string)) || null);
  const firstName = (currentUserData && (currentUserData['firstName'] as string)) || '';
  const lastName = (currentUserData && (currentUserData['lastName'] as string)) || '';
  const email = (currentUserData && (currentUserData['email'] as string)) || '';
  const birthDate = (currentUserData && (currentUserData['birthDate'] as string)) || '';
  const phoneNumber = (currentUserData && (currentUserData['phoneNumber'] as string)) || '';
  const nationalId = (currentUserData && (currentUserData['nationalId'] as string)) || '';
  const gender = (currentUserData && (currentUserData['gender'] as string)) || '';
  // Para mostrar el nombre del cine favorito del usuario logueado, necesitas el mapeo de IDs a nombres
  // Por ahora, si favoriteCinema es un ID, se mostrará el ID. Tendrás que ajustar esto si quieres el nombre.
  const userFavoriteCinemaId = (currentUserData && (currentUserData['favoriteCinema'] as string)) || '';
  const userFavoriteCinemaName = cinemas.find(c => c.id.toString() === userFavoriteCinemaId)?.name || userFavoriteCinemaId;


  const displayFullName =
    (firstName && lastName) ? `${firstName} ${lastName}` :
    firstName ? firstName :
    lastName ? lastName :
    'Usuario';

  useEffect(() => {
    // Actualizar avatarPreview cuando currentUserData cambie
    if (currentUserData && currentUserData.avatar) {
      setAvatarPreview(currentUserData.avatar as string);
    } else {
      setAvatarPreview(null);
    }
  }, [currentUserData]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      // Lógica para subir la imagen al servidor y actualizar currentUserData
    };
    reader.readAsDataURL(file);
  };

  // --- Manejo del Login ---
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const response = await authService.login(loginForm);
      if (response.token) {
        setIsLoggedIn(true);
        const updatedUser = authService.getCurrentUser();
        setCurrentUserData(updatedUser);
        setActiveView('mainProfile'); // Mostrar la vista principal del perfil después del login
      } else {
        setLoginError('Credenciales incorrectas o error al iniciar sesión.');
      }
    } catch (error: any) {
      console.error('Error durante el login:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError('Error al intentar iniciar sesión. Intenta de nuevo.');
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setCurrentUserData(null);
    setActiveView('login'); // Volver al formulario de login
    if (onClose) onClose();
    navigate('/'); // Redirige a la página principal
  };

  // --- Manejo del Registro ---
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setRegisterForm({ ...registerForm, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setRegisterForm({ ...registerForm, [name]: value });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }

    try {
      // Prepara el payload para el backend, excluyendo confirmPassword y contactPreference si no los espera
      // Construimos explícitamente el payload para evitar variables no usadas
      const payloadToSend: Partial<RegisterRequest> = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        birthDate: registerForm.birthDate || undefined,
        nationalId: registerForm.nationalId || undefined,
        phoneNumber: registerForm.phoneNumber || undefined,
        gender: registerForm.gender || undefined,
        favoriteCinema: registerForm.favoriteCinema || undefined, // Asegúrate de que este campo coincida con tu backend
        roles: registerForm.roles && registerForm.roles.length > 0 ? registerForm.roles : undefined,
      };

      await authService.register(payloadToSend as RegisterRequest);
      setRegisterSuccess('¡Cuenta creada exitosamente! Por favor, inicia sesión.');
      setRegisterForm({ // Resetear el formulario
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        birthDate: '', nationalId: '', phoneNumber: '', gender: '', favoriteCinema: '', contactPreference: false,
      });
      setShowRegisterPassword(false);
      setShowConfirmPassword(false);
      setActiveView('login'); // Volver al login para que el usuario inicie sesión
    } catch (error) {
      console.error('Error durante el registro:', error);
      const maybeErr = error as { response?: { data?: { message?: string } } } | undefined;
      if (maybeErr && maybeErr.response && maybeErr.response.data && maybeErr.response.data.message) {
        setRegisterError(maybeErr.response.data.message as string);
      } else {
        setRegisterError('Error al intentar registrarse. Intenta de nuevo.');
      }
    }
  };


  // --- Renderizado de Vistas ---

  // Componente/JSX para la Vista Principal del Perfil (con botones de navegación)
  const renderMainProfileView = () => (
    <div className="profile-content">
      <div className="profile-user-section">
        <div className="profile-avatar-wrapper">
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="profile-avatar-img-large" />
          ) : (
            <FaUserCircle className="profile-avatar-icon-large" />
          )}
          <label htmlFor="avatarInput" className="profile-edit-avatar-btn" aria-label="Editar avatar">
            <FaEdit size={16} color="white" />
            <input id="avatarInput" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>
        <p className="profile-username">{displayFullName.toUpperCase()}</p>
      </div>

      <div className="profile-actions-grid">
        <button className="profile-action-item" onClick={() => setActiveView('purchases')}>
          <FaShoppingBag size={24} />
          <span>Compras</span>
        </button>
        <button className="profile-action-item" onClick={() => setActiveView('account')}>
          <FaUser size={24} />
          <span>Cuenta</span>
        </button>
        <button className="profile-action-item" onClick={() => setActiveView('payment')}>
          <FaCreditCard size={24} />
          <span>Método de pago</span>
        </button>
        <button className="profile-action-item" onClick={() => setActiveView('contact')}>
          <FaEnvelope size={24} />
          <span>Escríbenos</span>
        </button>
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  );

  // Componente/JSX para la Vista de Cuenta (Información Personal)
  const renderAccountView = () => (
    <div className="sub-panel-content">
      <div className="sub-panel-header">
        <button className="back-btn" onClick={() => setActiveView('mainProfile')} aria-label="Volver atrás">
          <FaArrowLeft size={20} color="white" />
        </button>
        <h2 className="sub-panel-title">Mi perfil</h2>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
        </button>
      </div>
      <div className="personal-info-section">
        <h3 className="section-title">INFORMACIÓN PERSONAL</h3>
        <div className="info-item">
          <label>Nombre*</label>
          <input type="text" value={firstName} readOnly />
        </div>
        <div className="info-item">
          <label>Apellido*</label>
          <input type="text" value={lastName} readOnly />
        </div>
        <div className="info-item">
          <label>Correo electrónico</label>
          <input type="email" value={email} readOnly />
        </div>
        <div className="info-item">
          <label>Fecha de nacimiento*</label>
          <div className="input-with-icon">
            <input type="text" value={birthDate} readOnly />
            <FaCalendarAlt className="input-icon" size={20} />
          </div>
        </div>
        <div className="info-item">
          <label>Celular*</label>
          <input type="tel" value={phoneNumber} readOnly />
        </div>
        <div className="info-item">
          <label>Cine Favorito</label>
          <div className="input-with-icon">
            {/* Muestra el nombre del cine si se encontró, de lo contrario el ID o vacío */}
            <input type="text" value={userFavoriteCinemaName} readOnly />
            <FaMapMarkerAlt className="input-icon" size={20} />
          </div>
        </div>
        <div className="info-item">
          <label>Género*</label>
          <div className="input-with-icon">
            <input type="text" value={gender} readOnly />
            <FaGenderless className="input-icon" size={20} />
          </div>
        </div>
        <div className="info-item">
          <label>Número de Documento*</label>
          <div className="input-with-icon">
            <input type="text" value={nationalId} readOnly />
            <FaIdCard className="input-icon" size={20} />
          </div>
        </div>
        <div className="checkbox-item">
          <input type="checkbox" id="contact-preference" defaultChecked={true} disabled /> {/* Deshabilitado porque es vista de solo lectura */}
          <label htmlFor="contact-preference">Deseo ser contactado para recibir información de estrenos y promociones</label>
        </div>
        <button className="update-data-btn">ACTUALIZAR MIS DATOS</button>
      </div>
    </div>
  );

  // Componente/JSX para la Vista de Compras
  const renderPurchasesView = () => (
    <div className="sub-panel-content">
      <div className="sub-panel-header">
        <button className="back-btn" onClick={() => setActiveView('mainProfile')} aria-label="Volver atrás">
          <FaArrowLeft size={20} color="white" />
        </button>
        <h2 className="sub-panel-title">Últimas operaciones</h2>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
        </button>
      </div>
      <div className="empty-state-message">
        <p>CUANDO REALICES UN PEDIDO, SE MOSTRARÁ AQUÍ.</p>
      </div>
    </div>
  );

  // Componente/JSX para la Vista de Métodos de Pago (similar a Cuenta)
  const renderPaymentView = () => (
    <div className="sub-panel-content">
      <div className="sub-panel-header">
        <button className="back-btn" onClick={() => setActiveView('mainProfile')} aria-label="Volver atrás">
          <FaArrowLeft size={20} color="white" />
        </button>
        <h2 className="sub-panel-title">Métodos de Pago</h2>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
        </button>
      </div>
      <div className="personal-info-section">
        <h3 className="section-title">TARJETAS GUARDADAS</h3>
        <div className="empty-state-message">
          <p>Aún no tienes métodos de pago guardados.</p>
        </div>
        <button className="update-data-btn">AÑADIR MÉTODO DE PAGO</button>
      </div>
    </div>
  );

  // Componente/JSX para la Vista de Escríbenos (direccional sin rumbo)
  const renderContactView = () => (
    <div className="sub-panel-content">
      <div className="sub-panel-header">
        <button className="back-btn" onClick={() => setActiveView('mainProfile')} aria-label="Volver atrás">
          <FaArrowLeft size={20} color="white" />
        </button>
        <h2 className="sub-panel-title">Contáctanos</h2>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
        </button>
      </div>
      <div className="empty-state-message">
        <p>Aquí irá un formulario de contacto o enlaces a soporte.</p>
      </div>
    </div>
  );

  // Nuevo: Componente/JSX para el formulario de registro
  const renderRegisterView = () => (
    <div className="sub-panel-content register-panel-content"> {/* Añadimos una clase específica para estilos */}
      <div className="sub-panel-header">
        <button className="back-btn" onClick={() => setActiveView('login')} aria-label="Volver al login">
          <FaArrowLeft size={20} color="white" />
        </button>
        <h2 className="sub-panel-title">Crear Cuenta</h2>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
        </button>
      </div>

      <form onSubmit={handleRegisterSubmit} className="register-form">
        <h3 className="section-title">INFORMACIÓN PERSONAL</h3>

        <div className="input-group">
          <label htmlFor="registerFirstName">Nombre*</label>
          <input
            type="text"
            id="registerFirstName"
            name="firstName"
            value={registerForm.firstName}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="registerLastName">Apellido*</label>
          <input
            type="text"
            id="registerLastName"
            name="lastName"
            value={registerForm.lastName}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="registerEmail">Correo electrónico*</label>
          <input
            type="email"
            id="registerEmail"
            name="email"
            value={registerForm.email}
            onChange={handleRegisterChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="registerPassword">Contraseña*</label>
          <div className="password-input-wrapper">
            <input
              type={showRegisterPassword ? 'text' : 'password'}
              id="registerPassword"
              name="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              required
            />
            <button
              type="button"
              className="toggle-password-visibility"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              aria-label={showRegisterPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showRegisterPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="registerConfirmPassword">Confirmar Contraseña*</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="registerConfirmPassword"
              name="confirmPassword"
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              required
            />
            <button
              type="button"
              className="toggle-password-visibility"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="registerBirthDate">Fecha de nacimiento*</label>
          <div className="input-with-icon">
            <input
              type="date" // Usamos tipo 'date' para un selector de fecha nativo
              id="registerBirthDate"
              name="birthDate"
              value={registerForm.birthDate}
              onChange={handleRegisterChange}
              required
            />
            <FaCalendarAlt className="input-icon" size={20} />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="registerPhoneNumber">Celular*</label>
          <input
            type="tel"
            id="registerPhoneNumber"
            name="phoneNumber"
            value={registerForm.phoneNumber}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="registerFavoriteCinema">Cine Favorito</label>
          <div className="input-with-icon">
            <select
              id="registerFavoriteCinema"
              name="favoriteCinema"
              value={registerForm.favoriteCinema}
              onChange={handleRegisterChange}
              disabled={loadingCinemas}
            >
              <option value="">
                {loadingCinemas ? 'Cargando cines...' : 'Selecciona un cine'}
              </option>
              {errorCinemas && <option value="" disabled>{errorCinemas}</option>}
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </option>
              ))}
            </select>
            <FaMapMarkerAlt className="input-icon" size={20} />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="registerGender">Género*</label>
          <div className="input-with-icon">
            <select
              id="registerGender"
              name="gender"
              value={registerForm.gender}
              onChange={handleRegisterChange}
              required
            >
              <option value="">Selecciona un género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
            <FaGenderless className="input-icon" size={20} />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="registerNationalId">Número de Documento*</label>
          <input
            type="text"
            id="registerNationalId"
            name="nationalId"
            value={registerForm.nationalId}
            onChange={handleRegisterChange}
            required
          />
        </div>

        <div className="checkbox-item">
          <input
            type="checkbox"
            id="registerContactPreference"
            name="contactPreference"
            checked={registerForm.contactPreference}
            onChange={handleRegisterChange}
          />
          <label htmlFor="registerContactPreference">Deseo ser contactado para recibir información de estrenos y promociones</label>
        </div>

        {registerError && <p className="login-error-message">{registerError}</p>}
        {registerSuccess && <p className="login-success-message">{registerSuccess}</p>}

        <button type="submit" className="update-data-btn">VALIDAR CUENTA</button>
      </form>
    </div>
  );

  // --- Renderizado principal del ProfilePanel ---
  const renderContent = () => {
    // Si no está logueado y la vista es 'register', muestra el registro
    if (!isLoggedIn && activeView === 'register') {
        return renderRegisterView();
    }
    // Si no está logueado y la vista no es 'register' (es 'login'), muestra el login
    else if (!isLoggedIn) {
      return (
        <div className="login-panel-content">
          {registerSuccess && <p className="login-success-message">{registerSuccess}</p>} {/* Muestra éxito aquí también */}
          <h2 className="login-greeting">¡HOLA! QUÉ BUENO VERTE POR ACÁ.</h2>

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="usernameOrEmail">Correo electrónico</label>
              <input
                type="text"
                id="usernameOrEmail"
                name="usernameOrEmail"
                value={loginForm.usernameOrEmail}
                onChange={handleLoginChange}
                placeholder="tu.correo@example.com"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Contraseña*</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            {loginError && <p className="login-error-message">{loginError}</p>}

            <button type="submit" className="login-submit-btn">INICIAR SESIÓN</button>
          </form>

          <button className="forgot-password-btn">Olvidé mi contraseña</button>
          <button className="create-account-btn" onClick={() => setActiveView('register')}>CREAR CUENTA</button>
        </div>
      );
    }

    // Si está logueado, muestra la vista activa del perfil
    switch (activeView) {
      case 'mainProfile':
        return renderMainProfileView();
      case 'account':
        return renderAccountView();
      case 'purchases':
        return renderPurchasesView();
      case 'payment':
        return renderPaymentView();
      case 'contact':
        return renderContactView();
      default:
        return renderMainProfileView(); // Fallback para usuarios logueados
    }
  };

  const getPanelTitle = () => {
    // Títulos para las vistas de sub-panel (incluyendo registro)
    if (activeView === 'account') return 'Mi perfil';
    if (activeView === 'purchases') return 'Últimas operaciones';
    if (activeView === 'payment') return 'Métodos de Pago';
    if (activeView === 'contact') return 'Contáctanos';
    if (activeView === 'register') return 'Crear Cuenta';

    // Títulos para las vistas principales
    if (!isLoggedIn) return 'Iniciar sesión en Cinemark';
    return 'Perfil'; // Título por defecto para el perfil principal logueado
  };

  return (
    <div className="profile-panel-container">
      {/* El encabezado principal se muestra solo para Login/Perfil principal,
          los sub-paneles tienen su propio header */}
      {!(activeView === 'account' || activeView === 'purchases' || activeView === 'payment' || activeView === 'contact' || activeView === 'register') && (
        <div className="profile-header">
          <h2 className="profile-title">{getPanelTitle()}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default ProfilePanel;