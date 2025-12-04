import React, { useEffect, useState } from 'react';
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod, useUpdatePaymentMethod } from '../hooks/usePaymentMethods';
import authService, { type LoginRequest, type JwtResponse, type RegisterRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './ProfilePanel.css';
import { getAllCinemas } from '../services/cinemaService';
import type { Cinema } from '../types/Cinema';
import { getUserName } from '../services/userService';
import { useOrders } from '../hooks/useOrders';
import { generateOrderPDF } from '../utils/pdfGenerator';
import { COLORS } from '../styles/colors';

import {
  FaUserCircle, FaEdit, FaShoppingBag, FaUser, FaCreditCard, FaEnvelope, FaTimes, FaEye, FaEyeSlash,
  FaArrowLeft, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaGenderless, FaTrash, FaStar, FaPhone, FaDownload
} from 'react-icons/fa';

// --- Definición de Vistas ---
type ActiveView = 'mainProfile' | 'account' | 'purchases' | 'payment' | 'contact' | 'login' | 'register';

const ProfilePanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { logout, login: authLogin } = useAuth();
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


  // --- Métodos de pago: hooks y estados al nivel superior para cumplir reglas de hooks ---
  const paymentMethodsQuery = usePaymentMethods();
  const addPaymentMethodMutation = useAddPaymentMethod();
  const deletePaymentMethodMutation = useDeletePaymentMethod();
  const setDefaultPaymentMethodMutation = useSetDefaultPaymentMethod();
  const updatePaymentMethodMutation = useUpdatePaymentMethod();
  
  // --- Hook de órdenes/compras ---
  const ordersQuery = useOrders();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [paymentType, setPaymentType] = useState<'CARD' | 'YAPE'>('CARD');
  // Campos CARD
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expMonth, setExpMonth] = useState<number | ''>('');
  const [expYear, setExpYear] = useState<number | ''>('');
  const [cvc, setCvc] = useState('');
  // Campos YAPE
  const [yapePhone, setYapePhone] = useState('');
  const [yapeCode, setYapeCode] = useState('');
  // General
  const [setDefault, setSetDefault] = useState(false);

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentType === 'CARD') {
      if (!cardNumber || !holderName || !expMonth || !expYear || !cvc) return;
      addPaymentMethodMutation.mutate({ 
        type: 'CARD',
        cardNumber, 
        cardHolder: holderName, 
        expMonth: Number(expMonth), 
        expYear: Number(expYear), 
        cci: cvc,
        isDefault: setDefault 
      }, {
        onSuccess: () => {
          setCardNumber('');
          setHolderName('');
          setExpMonth('');
          setExpYear('');
          setCvc('');
          setSetDefault(false);
          setPaymentType('CARD');
          setShowAddForm(false);
        }
      });
    } else if (paymentType === 'YAPE') {
      if (!yapePhone || !yapeCode) return;
      addPaymentMethodMutation.mutate({ 
        type: 'YAPE',
        phone: yapePhone,
        verificationCode: yapeCode,
        isDefault: setDefault 
      }, {
        onSuccess: () => {
          setYapePhone('');
          setYapeCode('');
          setSetDefault(false);
          setPaymentType('CARD');
          setShowAddForm(false);
        }
      });
    }
  };

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


  // State to hold authoritative name from backend
  const [apiFirstName, setApiFirstName] = useState<string | null>(null);
  const [apiLastName, setApiLastName] = useState<string | null>(null);

  // Fetch authoritative first/last name from backend when we have a logged-in user id
  const userId = currentUserData?.id;
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      try {
        const resp = await getUserName(userId as number | string);
        if (!mounted) return;
        setApiFirstName(resp.firstName || null);
        setApiLastName(resp.lastName || null);
      } catch (err: unknown) {
        // ignore and keep using local values
        console.debug('No se pudo obtener nombre desde backend:', err);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const displayFullName =
    (apiFirstName || firstName) && (apiLastName || lastName) ? `${apiFirstName || firstName} ${apiLastName || lastName}` :
    (apiFirstName || firstName) ? (apiFirstName || firstName) :
    (apiLastName || lastName) ? (apiLastName || lastName) :
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
    // Validar campos requeridos antes de llamar API
    if (!loginForm.usernameOrEmail?.trim() || !loginForm.password?.trim()) {
      setLoginError('Por favor completa correo y contraseña.');
      return;
    }
    try {
      // Usar AuthContext para login (recarga de página en éxito ya gestionada allí)
      await authLogin(loginForm);
    } catch (error: unknown) {
      console.error('Error durante el login:', error);
      const maybeErr = error as { response?: { data?: { message?: string } } } | undefined;
      if (maybeErr && maybeErr.response && maybeErr.response.data && maybeErr.response.data.message) {
        setLoginError(maybeErr.response.data.message as string);
      } else {
        setLoginError('No se pudo iniciar sesión. Verifica tus datos.');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
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
  const renderPurchasesView = () => {
    const { data: orders = [], isLoading, isError } = ordersQuery;

    const handleDownloadPDF = async (orderId: number) => {
      try {
        setDownloadingId(orderId);
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await generateOrderPDF(order);
        }
      } catch (error) {
        console.error('Error descargando PDF:', error);
      } finally {
        setDownloadingId(null);
      }
    };

    return (
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

        {isLoading && (
          <div className="empty-state-message">
            <p>Cargando tus compras...</p>
          </div>
        )}

        {isError && (
          <div className="empty-state-message">
            <p>Error al cargar tus compras. Por favor, intenta nuevamente.</p>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="empty-state-message">
            <p>CUANDO REALICES UN PEDIDO, SE MOSTRARÁ AQUÍ.</p>
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
          <div className="purchases-list">
            {orders.map((order) => (
              <div key={order.id} className="purchase-card">
                <div className="purchase-header">
                  <h3>{order.movieTitle}</h3>
                  <span className={`purchase-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="purchase-details">
                  <p><strong>Fecha:</strong> {new Date(order.purchaseDate).toLocaleDateString('es-PE')}</p>
                  <p><strong>Cine:</strong> {order.cinemaName}</p>
                  <p><strong>Función:</strong> {new Date(order.showtimeDate || order.purchaseDate).toLocaleString('es-PE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Sala:</strong> {order.roomName}</p>
                  <p><strong>Total:</strong> S/ {order.totalAmount.toFixed(2)}</p>
                </div>
                <div className="purchase-actions">
                  <button 
                    className="btn-download"
                    onClick={() => handleDownloadPDF(order.id)}
                    disabled={downloadingId === order.id}
                    title="Descargar comprobante"
                  >
                    <FaDownload /> {downloadingId === order.id ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Componente/JSX para la Vista de Métodos de Pago (integrado con lógica real, sin hooks internos)
  const renderPaymentView = () => {
    const { data: methods = [], isLoading, isError } = paymentMethodsQuery;
    const addMutation = addPaymentMethodMutation;
    const delMutation = deletePaymentMethodMutation;
    const defMutation = setDefaultPaymentMethodMutation;
    const updateMutation = updatePaymentMethodMutation;

    const handleEditPayment = (m: any) => {
      setEditingPaymentId(m.id);
      if (m.type === 'CARD') {
        setPaymentType('CARD');
        setCvc('');
      } else {
        setPaymentType('YAPE');
        setYapeCode(m.verificationCode || '');
      }
    };

    const handleSaveEdit = () => {
      if (!editPasswordInput.trim()) {
        alert('Debes ingresar tu contraseña para confirmar');
        return;
      }
      
      if (editingPaymentId === null) return;

      const editingMethod = methods.find(m => m.id === editingPaymentId);
      if (!editingMethod) return;

      updateMutation.mutate({
        id: editingPaymentId,
        data: {
          type: editingMethod.type,
          ...(editingMethod.type === 'CARD' && cvc ? { cci: cvc } : {}),
          ...(editingMethod.type === 'YAPE' && yapeCode ? { verificationCode: yapeCode } : {}),
          isDefault: setDefault,
        }
      }, {
        onSuccess: () => {
          setEditingPaymentId(null);
          setEditPasswordInput('');
          setCvc('');
          setYapeCode('');
          setSetDefault(false);
        }
      });
    };

    return (
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
        <div className="personal-info-section" style={{maxWidth: '100%', margin: '0 auto', padding: '24px'}}>
          <h3 className="section-title">MÉTODOS DE PAGO GUARDADOS</h3>
          {isLoading && <p style={{textAlign: 'center', padding: '20px'}}>Cargando...</p>}
          {isError && <p style={{color: COLORS.error, textAlign: 'center', padding: '20px'}}>Error cargando métodos</p>}
          {!isLoading && methods.length === 0 && <p style={{textAlign: 'center', padding: '20px', color: COLORS.textSecondary}}>No hay métodos de pago guardados.</p>}
          <ul style={{marginBottom: '24px'}}>
            {methods.map(m => {
              const isEditing = editingPaymentId === m.id;
              const cardDisplay = m.type === 'CARD' 
                ? `•••• •••• •••• ${m.last4}` 
                : `••••••• ${(m.phone || '').slice(-3)}`;
              
              return (
                <li key={m.id} style={{background: COLORS.surface, borderRadius: 8, padding: '16px', marginBottom: '12px', border: `1px solid ${COLORS.border}`}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: 15, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {m.type === 'CARD' ? <FaCreditCard size={18} /> : <FaPhone size={18} />}
                        <span>{m.type === 'CARD' ? (m.brand || 'Tarjeta') : 'Yape'}</span>
                      </div>
                      <div style={{fontSize: 13, color: COLORS.textLight, marginBottom: 8, fontFamily: 'monospace', letterSpacing: '2px'}}>
                        {cardDisplay}
                      </div>
                      {m.type === 'CARD' && (
                        <div style={{fontSize: 12, color: COLORS.textMuted, marginBottom: 4}}>
                          Vence: {String(m.expMonth || m.expiryMonth).padStart(2, '0')}/{String(m.expYear || m.expiryYear).slice(-2)}
                        </div>
                      )}
                      {(m.default || m.isDefault) && (
                        <span style={{fontSize: 11, color: COLORS.success, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                          <FaStar size={10} /> Principal
                        </span>
                      )}
                      
                      {isEditing && (
                        <div style={{marginTop: '16px', padding: '12px', background: COLORS.border, borderRadius: 6}}>
                          <label style={{display: 'block', fontSize: 12, color: '#a1a1a1', marginBottom: '8px'}}>
                            {m.type === 'CARD' ? 'CVC' : 'Código de Verificación'}
                          </label>
                          <input 
                            type="password"
                            placeholder={m.type === 'CARD' ? 'Ingresa CVC' : 'Código de verificación'}
                            value={m.type === 'CARD' ? cvc : yapeCode}
                            onChange={e => m.type === 'CARD' ? setCvc(e.target.value) : setYapeCode(e.target.value)}
                            style={{width: '100%', padding: '8px 12px', background: '#27272a', border: '1px solid #52525b', borderRadius: 4, color: 'white', fontSize: 13, marginBottom: '8px'}}
                          />
                          <label style={{display: 'block', fontSize: 12, color: '#a1a1a1', marginBottom: '8px'}}>
                            Contraseña
                          </label>
                          <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
                            <input 
                              type={showEditPassword ? 'text' : 'password'}
                              placeholder="Ingresa tu contraseña"
                              value={editPasswordInput}
                              onChange={e => setEditPasswordInput(e.target.value)}
                              style={{flex: 1, padding: '8px 12px', background: '#27272a', border: '1px solid #52525b', borderRadius: 4, color: 'white', fontSize: 13}}
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              style={{padding: '8px 12px', background: '#52525b', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer'}}
                            >
                              {showEditPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                            </button>
                          </div>
                          <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: 12, cursor: 'pointer', marginBottom: '12px'}}>
                            <input 
                              type="checkbox"
                              checked={setDefault}
                              onChange={e => setSetDefault(e.target.checked)}
                              style={{cursor: 'pointer', width: 14, height: 14}}
                            />
                            <span>Usar como método principal</span>
                          </label>
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              style={{padding: '8px 12px', background: '#4f46e5', border: 'none', borderRadius: 4, color: 'white', fontSize: 12, cursor: 'pointer', opacity: updateMutation.isPending ? 0.6 : 1}}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPaymentId(null);
                                setEditPasswordInput('');
                                setCvc('');
                                setYapeCode('');
                                setSetDefault(false);
                              }}
                              style={{padding: '8px 12px', background: '#52525b', border: 'none', borderRadius: 4, color: 'white', fontSize: 12, cursor: 'pointer'}}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                      <button 
                        onClick={() => handleEditPayment(m)}
                        title="Editar"
                        style={{padding: '8px 10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        <FaEdit size={14} />
                      </button>
                      {!(m.default || m.isDefault) && (
                        <button 
                          onClick={() => defMutation.mutate(m.id)}
                          title="Establecer como principal"
                          style={{padding: '8px 10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          <FaStar size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => delMutation.mutate(m.id)}
                        title="Eliminar"
                        style={{padding: '8px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          
          <div style={{textAlign: 'center'}}>
            {!showAddForm && (
              <button className="update-data-btn" onClick={() => {
                setShowAddForm(true);
                setPaymentType('CARD');
              }} style={{width:'100%', padding: '12px 20px', fontSize: 14, fontWeight: 600}}>
                ＋ AÑADIR NUEVO MÉTODO DE PAGO
              </button>
            )}
            
            {showAddForm && (
              <div style={{marginTop: '16px', background: '#27272a', borderRadius: 12, padding: '24px', border: '1px solid #3f3f46'}}>
                <h4 style={{marginBottom: '20px', fontSize: 16, fontWeight: 600, textAlign: 'center'}}>Selecciona el tipo de método</h4>
                
                {/* Selector de tipo */}
                <div style={{display: 'flex', gap: '12px', marginBottom: '24px'}}>
                  <button
                    type="button"
                    onClick={() => setPaymentType('CARD')}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      background: paymentType === 'CARD' ? '#ef4444' : '#3f3f46',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 14,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaCreditCard size={18} /> Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('YAPE')}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      background: paymentType === 'YAPE' ? '#ef4444' : '#3f3f46',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: 14,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaPhone size={18} /> Yape
                  </button>
                </div>

                <form onSubmit={handleAddPaymentMethod} style={{display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', overflow: 'hidden'}}>
                  {paymentType === 'CARD' ? (
                    <>
                      <input 
                        placeholder="Número de tarjeta" 
                        value={cardNumber} 
                        onChange={e=>setCardNumber(e.target.value)} 
                        className="bg-neutral-800 px-4 py-3 rounded text-white" 
                        style={{fontSize: 14, border: 'none', width: '100%', boxSizing: 'border-box'}} 
                      />
                      <input 
                        placeholder="Titular" 
                        value={holderName} 
                        onChange={e=>setHolderName(e.target.value)} 
                        className="bg-neutral-800 px-4 py-3 rounded text-white" 
                        style={{fontSize: 14, border: 'none', width: '100%', boxSizing: 'border-box'}} 
                      />
                      <div style={{display: 'flex', gap:'12px', width: '100%', boxSizing: 'border-box'}}>
                        <input 
                          placeholder="Mes (MM)" 
                          value={expMonth} 
                          onChange={e=>setExpMonth(e.target.value as any)} 
                          className="bg-neutral-800 px-4 py-3 rounded text-white" 
                          style={{fontSize: 14, border: 'none', flex: 1, minWidth: 0, boxSizing: 'border-box'}} 
                        />
                        <input 
                          placeholder="Año (YY)" 
                          value={expYear} 
                          onChange={e=>setExpYear(e.target.value as any)} 
                          className="bg-neutral-800 px-4 py-3 rounded text-white" 
                          style={{fontSize: 14, border: 'none', flex: 1, minWidth: 0, boxSizing: 'border-box'}} 
                        />
                        <input 
                          placeholder="CVC" 
                          value={cvc} 
                          onChange={e=>setCvc(e.target.value)} 
                          className="bg-neutral-800 px-4 py-3 rounded text-white" 
                          style={{fontSize: 14, border: 'none', flex: 1, minWidth: 0, boxSizing: 'border-box'}} 
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <input 
                        placeholder="Número de teléfono" 
                        value={yapePhone} 
                        onChange={e=>setYapePhone(e.target.value)} 
                        className="bg-neutral-800 px-4 py-3 rounded text-white" 
                        style={{fontSize: 14, border: 'none', width: '100%', boxSizing: 'border-box'}} 
                      />
                      <input 
                        placeholder="Código de verificación" 
                        value={yapeCode} 
                        onChange={e=>setYapeCode(e.target.value)} 
                        className="bg-neutral-800 px-4 py-3 rounded text-white" 
                        style={{fontSize: 14, border: 'none', width: '100%', boxSizing: 'border-box'}} 
                      />
                    </>
                  )}
                  
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: 14, marginTop: '8px', cursor: 'pointer'}}>
                    <input 
                      type="checkbox" 
                      checked={setDefault} 
                      onChange={e=>setSetDefault(e.target.checked)} 
                      style={{cursor: 'pointer', width: 16, height: 16}} 
                    /> 
                    <span>Usar como método principal</span>
                  </label>

                  <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'12px', marginTop:'20px'}}>
                    <button 
                      type="submit" 
                      disabled={addMutation.isPending} 
                      className="update-data-btn" 
                      style={{padding: '12px 20px', opacity: addMutation.isPending ? 0.6 : 1, cursor: addMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600}}
                    >
                      {addMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button 
                      type="button" 
                      style={{padding: '12px 20px', background:'#52525b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600}} 
                      onClick={()=>{
                        setShowAddForm(false);
                        setCardNumber('');
                        setHolderName('');
                        setExpMonth('');
                        setExpYear('');
                        setCvc('');
                        setYapePhone('');
                        setYapeCode('');
                        setSetDefault(false);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  {addMutation.isError && (
                    <div style={{color:'#ff6b6b', fontSize:13, textAlign: 'center', background: '#3f2323', padding: '10px', borderRadius: 6, marginTop: 8}}>
                      Error al guardar método de pago
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    if (!isLoggedIn) return '';
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