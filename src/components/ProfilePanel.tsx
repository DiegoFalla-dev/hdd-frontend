import React, { useEffect, useState } from 'react';
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod, useUpdatePaymentMethod } from '../hooks/usePaymentMethods';
import authService, { type LoginRequest, type JwtResponse, type RegisterRequest } from '../services/authService';
// Comentado: getCardType no se usa en ProfilePanel
import { validateCardNumber, validateExpiry, formatCardNumber, formatExpiry } from '../utils/cardValidator';
import { useAuth } from '../context/AuthContext';
import './ProfilePanel.css';
import { getAllCinemas } from '../services/cinemaService';
import type { Cinema } from '../types/Cinema';
// Comentado: getUserName no se usa en ProfilePanel
import { getUserById, updateBillingInfo, updateUser } from '../services/userService';
import { useOrders } from '../hooks/useOrders';
import { generateOrderPDF } from '../utils/pdfGenerator';
import { COLORS } from '../styles/colors';

import {
  FaUserCircle, FaEdit, FaShoppingBag, FaUser, FaCreditCard, FaEnvelope, FaTimes, FaEye, FaEyeSlash,
  FaArrowLeft, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaGenderless, FaTrash, FaStar, FaPhone, FaDownload,
  FaGift, FaQuestionCircle
} from 'react-icons/fa';

// --- Definición de Vistas ---
type ActiveView = 'mainProfile' | 'account' | 'purchases' | 'payment' | 'contact' | 'login' | 'register' | 'fidelization';

const ProfilePanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { logout, login: authLogin, user: authUser } = useAuth();
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
  const [expiry, setExpiry] = useState('');
  const [cardValidationErrors, setCardValidationErrors] = useState<Record<string, string>>({});
  const [cvc, setCvc] = useState('');
  // Campos YAPE
  const [yapePhone, setYapePhone] = useState('');
  const [yapeCode, setYapeCode] = useState('');
  // General
  const [setDefault, setSetDefault] = useState(false);
  const [fidelityPoints, setFidelityPoints] = useState(0);
  // Comentado: showRedeemModal y setShowRedeemModal no se usan
  // const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [showRedeemForm, setShowRedeemForm] = useState(false);

  // Estados para la validación de cuenta para facturas
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingRuc, setBillingRuc] = useState('');
  const [billingRazonSocial, setBillingRazonSocial] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState(false);
  const [userRuc, setUserRuc] = useState<string | null>(null);
  const [userRazonSocial, setUserRazonSocial] = useState<string | null>(null);
  const [billingPanelOpen, setBillingPanelOpen] = useState(false);

  // Estados para editar celular y cine favorito
  const [editingPhoneAndCinema, setEditingPhoneAndCinema] = useState(false);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editFavoriteCinemaId, setEditFavoriteCinemaId] = useState<string>('');
  const [editingLoading, setEditingLoading] = useState(false);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editingSuccess, setEditingSuccess] = useState(false);

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (paymentType === 'CARD') {
      // Validar tarjeta
      if (!cardNumber) {
        errors.cardNumber = 'Número de tarjeta requerido';
      } else if (!validateCardNumber(cardNumber)) {
        errors.cardNumber = 'Número de tarjeta inválido';
      }
      
      if (!holderName) {
        errors.holderName = 'Nombre del titular requerido';
      }
      
      if (!expiry) {
        errors.expiry = 'Fecha de vencimiento requerida (MM/YY)';
      } else if (!validateExpiry(expiry)) {
        errors.expiry = 'Fecha de vencimiento inválida o expirada';
      }
      
      if (!cvc || cvc.length < 3) {
        errors.cvc = 'CVC debe tener al menos 3 dígitos';
      }
      
      setCardValidationErrors(errors);
      
      if (Object.keys(errors).length > 0) return;
      
      // Parsear expiry
      const [expMonth, expYear] = expiry.split('/').map(x => parseInt(x, 10));
      
      addPaymentMethodMutation.mutate({ 
        type: 'CARD',
        cardNumber, 
        cardHolder: holderName, 
        expMonth, 
        expYear: expYear + 2000, // Convertir 24 a 2024
        cci: cvc,
        isDefault: setDefault 
      }, {
        onSuccess: () => {
          setCardNumber('');
          setHolderName('');
          setExpiry('');
          setCvc('');
          setSetDefault(false);
          setPaymentType('CARD');
          setShowAddForm(false);
          setCardValidationErrors({});
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
    const user = authUser || authService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUserData(user);
      setActiveView('mainProfile'); // Si está logueado, muestra la vista principal del perfil
    } else {
      setIsLoggedIn(false);
      setCurrentUserData(null);
      setActiveView('login'); // Si no, muestra el login
    }
  }, [authUser]);

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

  // --- Datos del usuario para el perfil (desde BD) ---
  const [userFullData, setUserFullData] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const firstName = userFullData?.firstName || '';
  const lastName = userFullData?.lastName || '';
  const email = userFullData?.email || '';
  const birthDate = userFullData?.birthDate || '';
  const phoneNumber = userFullData?.phoneNumber || '';
  const nationalId = userFullData?.nationalId || '';
  const gender = userFullData?.gender || '';
  const userFavoriteCinemaName = userFullData?.favoriteCinema?.name || '—';

  // Cargar TODOS los datos del usuario desde la BD
  const userId = currentUserData?.id;
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const fetchAllUserData = async () => {
      try {
        console.log('Fetching complete user data for id:', userId);
        const userData = await getUserById(userId as number);
        console.log('Complete user data received:', userData);
        if (!mounted) return;
        
        setUserFullData(userData);
        setFidelityPoints(userData?.fidelityPoints || 0);
        setUserRuc(userData?.ruc || null);
        setUserRazonSocial(userData?.razonSocial || null);
        setEditPhoneNumber(userData?.phoneNumber || '');
        setEditFavoriteCinemaId(userData?.favoriteCinema?.id?.toString() || '');
        if (userData?.avatar) {
          setAvatarPreview(userData.avatar);
        }
      } catch (err) {
        console.error('Error fetching complete user data:', err);
      }
    };
    
    fetchAllUserData();
    return () => { mounted = false; };
  }, [userId]);

  const displayFullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Usuario';

  useEffect(() => {
    // El avatar ya se actualiza en el useEffect principal de carga de datos
  }, [userFullData?.avatar]);

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

  // Manejar actualización de datos de facturación (RUC y razón social)
  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingError(null);
    setBillingSuccess(false);

    if (!billingRuc.trim() || !billingRazonSocial.trim()) {
      setBillingError('RUC y Razón Social son requeridos');
      return;
    }

    if (billingRuc.trim().length < 8) {
      setBillingError('RUC debe tener al menos 8 caracteres');
      return;
    }

    setBillingLoading(true);
    try {
      await updateBillingInfo(currentUserData?.id as number, billingRuc.trim(), billingRazonSocial.trim());
      setUserRuc(billingRuc.trim());
      setUserRazonSocial(billingRazonSocial.trim());
      setBillingSuccess(true);
      setShowBillingForm(false);
      setBillingRuc('');
      setBillingRazonSocial('');
      setTimeout(() => setBillingSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating billing info:', err);
      setBillingError(err?.response?.data?.message || 'Error al actualizar información de facturación');
    } finally {
      setBillingLoading(false);
    }
  };

  // Manejar actualización de celular y cine favorito
  const handlePhoneAndCinemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingError(null);
    setEditingSuccess(false);

    if (!editPhoneNumber.trim()) {
      setEditingError('El número de celular es requerido');
      return;
    }

    if (editPhoneNumber.trim().length < 7) {
      setEditingError('El número de celular debe tener al menos 7 dígitos');
      return;
    }

    setEditingLoading(true);
    try {
      const updateData: any = {
        phoneNumber: editPhoneNumber.trim(),
      };
      if (editFavoriteCinemaId) {
        updateData.favoriteCinema = { id: parseInt(editFavoriteCinemaId, 10) };
      }
      await updateUser(userId as number, updateData);
      
      // Recargar los datos del usuario
      const updatedUser = await getUserById(userId as number);
      setUserFullData(updatedUser);
      
      setEditingSuccess(true);
      setEditingPhoneAndCinema(false);
      setTimeout(() => setEditingSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating phone and cinema:', err);
      setEditingError(err?.response?.data?.message || 'Error al actualizar celular y cine favorito');
    } finally {
      setEditingLoading(false);
    }
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
        <button className="profile-action-item" onClick={() => setActiveView('fidelization')}>
          <FaStar size={24} />
          <span>Fidelización</span>
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
          {!editingPhoneAndCinema ? (
            <input type="tel" value={phoneNumber} readOnly />
          ) : (
            <input 
              type="tel" 
              value={editPhoneNumber} 
              onChange={(e) => setEditPhoneNumber(e.target.value)}
              placeholder="Ingresa tu número de celular"
            />
          )}
        </div>
        <div className="info-item">
          <label>Cine Favorito</label>
          <div className="input-with-icon">
            {!editingPhoneAndCinema ? (
              <>
                <input type="text" value={userFavoriteCinemaName} readOnly />
                <FaMapMarkerAlt className="input-icon" size={20} />
              </>
            ) : (
              <select 
                value={editFavoriteCinemaId} 
                onChange={(e) => setEditFavoriteCinemaId(e.target.value)}
                style={{ paddingRight: '40px' }}
              >
                <option value="">Selecciona un cine</option>
                {cinemas.map((cinema) => (
                  <option key={cinema.id} value={cinema.id.toString()}>
                    {cinema.name} - {cinema.city}
                  </option>
                ))}
              </select>
            )}
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
        
        {editingSuccess && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#22c55e30',
            border: '1px solid #22c55e',
            borderRadius: '6px',
            color: '#22c55e',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ✓ Celular y cine favorito actualizados correctamente
          </div>
        )}

        {editingError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ef444430',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ✗ {editingError}
          </div>
        )}

        {!editingPhoneAndCinema ? (
          <button 
            type="button"
            className="update-data-btn"
            onClick={() => setEditingPhoneAndCinema(true)}
          >
            EDITAR
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button"
              className="update-data-btn"
              onClick={handlePhoneAndCinemaSubmit}
              disabled={editingLoading}
              style={{ flex: 1, opacity: editingLoading ? 0.6 : 1 }}
            >
              {editingLoading ? 'Guardando...' : 'GUARDAR CAMBIOS'}
            </button>
            <button 
              type="button"
              className="update-data-btn"
              onClick={() => {
                setEditingPhoneAndCinema(false);
                setEditPhoneNumber(phoneNumber);
                setEditFavoriteCinemaId(userFullData?.favoriteCinema?.id?.toString() || '');
                setEditingError(null);
              }}
              style={{ flex: 1, backgroundColor: '#666' }}
            >
              CANCELAR
            </button>
          </div>
        )}
      </div>

      {/* Sección de Validación de Cuenta para Facturas */}
      <div className="personal-info-section" style={{ marginTop: '32px' }}>
        <button
          type="button"
          className="update-data-btn"
          onClick={() => setBillingPanelOpen(!billingPanelOpen)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Facturación</span>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {billingPanelOpen ? '▲' : '▼'}
          </span>
        </button>

        {billingPanelOpen && (
          <div style={{ marginTop: '16px' }}>
            <h3 className="section-title">VALIDACIÓN DE CUENTA PARA FACTURAS</h3>
            <p style={{ fontSize: '14px', color: '#a1a1a1', marginBottom: '16px' }}>
              Completa tu información de facturación para poder emitir facturas en tus compras.
            </p>

            {billingSuccess && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#22c55e30',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                color: '#22c55e',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ✓ Información de facturación actualizada correctamente
              </div>
            )}

            {!showBillingForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="info-item">
                  <label>RUC</label>
                  <input type="text" value={userRuc || 'No configurado'} readOnly />
                </div>
                <div className="info-item">
                  <label>Razón Social</label>
                  <input type="text" value={userRazonSocial || 'No configurada'} readOnly />
                </div>
                <button
                  onClick={() => setShowBillingForm(true)}
                  style={{
                    marginTop: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {userRuc && userRazonSocial ? '✏️ Editar información' : '➕ Validar Cuenta para Facturas'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleBillingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="info-item">
                  <label>RUC*</label>
                  <input
                    type="text"
                    value={billingRuc}
                    onChange={(e) => setBillingRuc(e.target.value)}
                    placeholder="Ej: 20123456789"
                    required
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="info-item">
                  <label>Razón Social*</label>
                  <input
                    type="text"
                    value={billingRazonSocial}
                    onChange={(e) => setBillingRazonSocial(e.target.value)}
                    placeholder="Ej: Mi Empresa S.A.C."
                    required
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                {billingError && (
                  <div style={{ color: '#ef4444', fontSize: '14px', padding: '8px 12px', backgroundColor: '#ef444430', borderRadius: '6px' }}>
                    {billingError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={billingLoading}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: billingLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: billingLoading ? 0.6 : 1
                    }}
                  >
                    {billingLoading ? 'Guardando...' : '✓ Validar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBillingForm(false);
                      setBillingRuc('');
                      setBillingRazonSocial('');
                      setBillingError(null);
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
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
          // Cast OrderSummary a OrderDTO para compatibilidad con generateOrderPDF
          await generateOrderPDF(order as any);
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
                      <div>
                        <input 
                          placeholder="Número de tarjeta" 
                          value={cardNumber} 
                          onChange={e => setCardNumber(formatCardNumber(e.target.value))} 
                          className="bg-neutral-800 px-4 py-3 rounded text-white" 
                          style={{fontSize: 14, border: cardValidationErrors.cardNumber ? '2px solid #ef4444' : 'none', width: '100%', boxSizing: 'border-box'}} 
                        />
                        {cardValidationErrors.cardNumber && (
                          <p style={{color: '#ef4444', fontSize: 12, marginTop: '4px'}}>{cardValidationErrors.cardNumber}</p>
                        )}
                      </div>
                      <div>
                        <input 
                          placeholder="Titular" 
                          value={holderName} 
                          onChange={e => setHolderName(e.target.value)} 
                          className="bg-neutral-800 px-4 py-3 rounded text-white" 
                          style={{fontSize: 14, border: cardValidationErrors.holderName ? '2px solid #ef4444' : 'none', width: '100%', boxSizing: 'border-box'}} 
                        />
                        {cardValidationErrors.holderName && (
                          <p style={{color: '#ef4444', fontSize: 12, marginTop: '4px'}}>{cardValidationErrors.holderName}</p>
                        )}
                      </div>
                      <div style={{display: 'flex', gap:'12px', width: '100%', boxSizing: 'border-box'}}>
                        <div style={{flex: 1}}>
                          <input 
                            placeholder="MM/YY" 
                            value={expiry} 
                            onChange={e => setExpiry(formatExpiry(e.target.value))} 
                            className="bg-neutral-800 px-4 py-3 rounded text-white" 
                            style={{fontSize: 14, border: cardValidationErrors.expiry ? '2px solid #ef4444' : 'none', width: '100%', boxSizing: 'border-box'}} 
                          />
                          {cardValidationErrors.expiry && (
                            <p style={{color: '#ef4444', fontSize: 12, marginTop: '4px'}}>{cardValidationErrors.expiry}</p>
                          )}
                        </div>
                        <div style={{flex: 1}}>
                          <input 
                            placeholder="CVC" 
                            value={cvc} 
                            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                            className="bg-neutral-800 px-4 py-3 rounded text-white" 
                            style={{fontSize: 14, border: cardValidationErrors.cvc ? '2px solid #ef4444' : 'none', width: '100%', boxSizing: 'border-box'}} 
                          />
                          {cardValidationErrors.cvc && (
                            <p style={{color: '#ef4444', fontSize: 12, marginTop: '4px'}}>{cardValidationErrors.cvc}</p>
                          )}
                        </div>
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
                        setExpiry('');
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

  // Vista de Fidelización
  const renderFidelizationView = () => {
    // Cálculo simple: cada 100 puntos = 10 soles de descuento
    const discountPerHundred = 10; // S/ 10 de descuento por cada 100 puntos
    const totalDiscount = Math.floor(fidelityPoints / 100) * discountPerHundred;
    const canRedeem = fidelityPoints >= 100;
    const nextMilestone = Math.ceil(fidelityPoints / 100) * 100;
    const pointsToNextDiscount = nextMilestone - fidelityPoints;
    const progressToNext = ((fidelityPoints % 100) / 100) * 100;

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch {
        return dateString;
      }
    };

    const handleRedeem = async () => {
      const pointsToRedeem = redeemQuantity * 100;
      if (pointsToRedeem > fidelityPoints) {
        alert('No tienes suficientes puntos para canjear esta cantidad');
        return;
      }

      try {
        const token = localStorage.getItem('cineplus:accessToken') || localStorage.getItem('token');
        if (!token) {
          alert('Debes iniciar sesión para canjear puntos');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/users/${currentUserData?.id}/redeem-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ points: pointsToRedeem }),
        });

        if (response.ok) {
          // Comentado: result no se usa
          // const result = await response.json();
          setFidelityPoints(Math.max(0, fidelityPoints - pointsToRedeem));
          setRedeemSuccess(true);
          setRedeemQuantity(1);
          setShowRedeemForm(false);
          setTimeout(() => setRedeemSuccess(false), 3000);
        } else {
          const error = await response.json();
          alert(`Error: ${error.message || 'No se pudo canjear los puntos'}`);
        }
      } catch (error) {
        console.error('Error canjeando puntos:', error);
        alert('Error al procesar el canje de puntos');
      }
    };

    return (
      <div className="sub-panel-content">
        <div className="sub-panel-header">
          <button className="back-btn" onClick={() => setActiveView('mainProfile')} aria-label="Volver atrás">
            <FaArrowLeft size={20} color="white" />
          </button>
          <h2 className="sub-panel-title">Mi Fidelización CinePlus</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <FaTimes size={20} color="white" />
          </button>
        </div>

        <div className="personal-info-section" style={{maxWidth: '100%', margin: '0 auto', padding: '24px'}}>
          {/* Mensaje de éxito */}
          {redeemSuccess && (
            <div style={{background: '#10b981', borderRadius: 12, padding: '16px', marginBottom: '24px', color: 'white', border: '1px solid #059669', display: 'flex', alignItems: 'center', gap: 12}}>
              <span style={{fontSize: 20}}>✓</span>
              <div>
                <p style={{fontSize: 13, fontWeight: 600, margin: 0}}>¡Canje Exitoso!</p>
                <p style={{fontSize: 12, opacity: 0.9, margin: '4px 0 0 0'}}>Tu descuento ha sido aplicado a tu cuenta</p>
              </div>
            </div>
          )}

          {/* Tarjeta Principal - Puntos y Descuento Disponible */}
          <div style={{background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', borderRadius: 12, padding: '32px 24px', marginBottom: '24px', color: 'white', textAlign: 'center', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)'}}>
            <h3 style={{fontSize: 13, fontWeight: 500, marginBottom: 16, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1}}>Resumen de Fidelización</h3>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20}}>
              {/* Puntos */}
              <div style={{padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8}}>
                <p style={{fontSize: 11, opacity: 0.85, marginBottom: 8, fontWeight: 500}}>Puntos Acumulados</p>
                <p style={{fontSize: 40, fontWeight: 700, margin: 0}}>{fidelityPoints}</p>
                <p style={{fontSize: 10, opacity: 0.8, marginTop: 4}}>pts</p>
              </div>
              
              {/* Descuento disponible */}
              <div style={{padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8}}>
                <p style={{fontSize: 11, opacity: 0.85, marginBottom: 8, fontWeight: 500}}>Descuento Disponible</p>
                <p style={{fontSize: 40, fontWeight: 700, margin: 0, color: '#fef08a'}}>S/ {totalDiscount}</p>
                <p style={{fontSize: 10, opacity: 0.8, marginTop: 4}}>por canjear</p>
              </div>
            </div>

            {/* Progreso hasta próximo descuento */}
            <div style={{marginTop: 16}}>
              <p style={{fontSize: 12, opacity: 0.9, marginBottom: 8}}>Progreso al siguiente descuento de S/ {discountPerHundred}</p>
              <div style={{height: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden', marginBottom: 8}}>
                <div style={{height: '100%', width: `${Math.min(progressToNext, 100)}%`, background: '#fef08a', transition: 'width 0.3s ease'}} />
              </div>
              <p style={{fontSize: 11, opacity: 0.85}}>
                {fidelityPoints % 100} / 100 pts ({Math.round(progressToNext)}%) - {pointsToNextDiscount > 0 ? `Faltan ${pointsToNextDiscount} puntos` : '¡Listo para canjear!'}
              </p>
            </div>
          </div>

          {/* Información de Última Compra */}
          <div style={{background: COLORS.surface, borderRadius: 12, padding: '20px', marginBottom: '24px', border: `1px solid ${COLORS.border}`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
              <FaShoppingBag size={18} color="#ef4444" />
              <h4 style={{fontSize: 14, fontWeight: 600, margin: 0}}>Última Compra Registrada</h4>
            </div>
            <p style={{fontSize: 16, fontWeight: 500, color: 'white', margin: '0'}}>{formatDate(currentUserData?.lastPurchaseDate)}</p>
            <p style={{fontSize: 12, color: COLORS.textSecondary, margin: '8px 0 0 0'}}>Sigue comprando para acumular más puntos</p>
          </div>

          {/* Sección de Canje */}
          <div style={{background: COLORS.surface, borderRadius: 12, padding: '24px', marginBottom: '24px', border: `1px solid ${COLORS.border}`}}>
            <h4 style={{fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <FaGift size={16} color="#ef4444" />
              Canjear Puntos
            </h4>

            {!showRedeemForm ? (
              <button 
                onClick={() => setShowRedeemForm(true)}
                disabled={!canRedeem}
                style={{
                  width: '100%',
                  background: canRedeem ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '14px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canRedeem ? 'pointer' : 'not-allowed',
                  transition: 'transform 0.2s ease',
                  opacity: canRedeem ? 1 : 0.6,
                }}
                onMouseEnter={(e) => canRedeem && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                ✨ {canRedeem ? `Canjear S/ ${totalDiscount}` : 'Acumula 100 puntos para canjear'}
              </button>
            ) : (
              <div style={{background: '#1f2937', borderRadius: 8, padding: '16px', border: '1px solid #374151'}}>
                <p style={{fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'white'}}>¿Cuántos descuentos deseas canjear?</p>
                
                <div style={{display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', marginBottom: 16}}>
                  <button
                    onClick={() => setRedeemQuantity(Math.max(1, redeemQuantity - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 6,
                      background: '#374151',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    −
                  </button>

                  <div style={{background: '#111827', borderRadius: 6, padding: '8px 12px', textAlign: 'center'}}>
                    <p style={{fontSize: 14, fontWeight: 700, color: '#fbbf24', margin: 0}}>{redeemQuantity}</p>
                    <p style={{fontSize: 10, color: COLORS.textSecondary, margin: '4px 0 0 0'}}>x 100 pts</p>
                  </div>

                  <button
                    onClick={() => setRedeemQuantity(redeemQuantity + 1)}
                    disabled={redeemQuantity * 100 >= fidelityPoints}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 6,
                      background: redeemQuantity * 100 >= fidelityPoints ? '#6b7280' : '#374151',
                      color: 'white',
                      border: 'none',
                      cursor: redeemQuantity * 100 >= fidelityPoints ? 'not-allowed' : 'pointer',
                      fontSize: 18,
                      fontWeight: 600,
                      opacity: redeemQuantity * 100 >= fidelityPoints ? 0.5 : 1,
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{background: '#111827', borderRadius: 8, padding: '12px', marginBottom: 16, border: '1px solid #374151'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                    <span style={{fontSize: 12, color: COLORS.textSecondary}}>Puntos a Canjear:</span>
                    <span style={{fontSize: 12, fontWeight: 600, color: '#fbbf24'}}>{redeemQuantity * 100} pts</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontSize: 12, color: COLORS.textSecondary}}>Descuento Total:</span>
                    <span style={{fontSize: 14, fontWeight: 700, color: '#10b981'}}>S/ {redeemQuantity * discountPerHundred}</span>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                  <button
                    onClick={() => {
                      setShowRedeemForm(false);
                      setRedeemQuantity(1);
                    }}
                    style={{
                      background: '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRedeem}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirmar Canje
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cómo Funciona el Sistema */}
          <div style={{background: COLORS.surface, borderRadius: 12, padding: '24px', marginBottom: '24px', border: `1px solid ${COLORS.border}`}}>
            <h4 style={{fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <FaStar size={16} color="#ef4444" />
              Cómo Funciona
            </h4>
            <div style={{display: 'grid', gap: 12}}>
              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 4}}>💰 Conversión Simple</p>
                <p style={{fontSize: 13, color: 'white', margin: 0}}>Cada <strong>100 puntos</strong> = <strong>S/ 10 de descuento</strong></p>
              </div>
              
              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 4}}>✓ Cómo Ganar Puntos</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>
                  • Compra de tickets: 1 pto = S/ 1<br/>
                  • Comidas y bebidas: 1 pto = S/ 1<br/>
                  • Promociones especiales: Hasta x2 puntos
                </p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#f97316', marginBottom: 4}}>🎁 Cómo Canjear</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>
                  Usa el botón "Canjear Puntos" arriba. Se aplicará un descuento de <strong>S/ 10</strong> por cada <strong>100 puntos</strong> canjeados en tu próxima compra.
                </p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 4}}>⏰ Validez de Descuentos</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>
                  Los descuentos canjeados son válidos por <strong>180 días</strong> desde la fecha de canje. Los puntos nunca expiran mientras mantengas actividad.
                </p>
              </div>
            </div>
          </div>

          {/* Ejemplos de Canje */}
          <div style={{background: COLORS.surface, borderRadius: 12, padding: '24px', marginBottom: '24px', border: `1px solid ${COLORS.border}`}}>
            <h4 style={{fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <FaGift size={16} color="#ef4444" />
              Ejemplos de Valor de Canje
            </h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px'}}>
              <div style={{padding: '16px', background: '#1f2937', borderRadius: 8, textAlign: 'center', border: '1px solid #374151'}}>
                <p style={{fontSize: 11, color: COLORS.textSecondary, marginBottom: 6}}>100 Puntos</p>
                <p style={{fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0}}>S/ 10</p>
              </div>
              <div style={{padding: '16px', background: '#1f2937', borderRadius: 8, textAlign: 'center', border: '1px solid #374151'}}>
                <p style={{fontSize: 11, color: COLORS.textSecondary, marginBottom: 6}}>200 Puntos</p>
                <p style={{fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0}}>S/ 20</p>
              </div>
              <div style={{padding: '16px', background: '#1f2937', borderRadius: 8, textAlign: 'center', border: '1px solid #374151'}}>
                <p style={{fontSize: 11, color: COLORS.textSecondary, marginBottom: 6}}>500 Puntos</p>
                <p style={{fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0}}>S/ 50</p>
              </div>
              <div style={{padding: '16px', background: '#1f2937', borderRadius: 8, textAlign: 'center', border: '1px solid #374151'}}>
                <p style={{fontSize: 11, color: COLORS.textSecondary, marginBottom: 6}}>1000 Puntos</p>
                <p style={{fontSize: 20, fontWeight: 700, color: '#10b981', margin: 0}}>S/ 100</p>
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes */}
          <div style={{background: COLORS.surface, borderRadius: 12, padding: '24px', border: `1px solid ${COLORS.border}`}}>
            <h4 style={{fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <FaQuestionCircle size={16} color="#f97316" />
              Preguntas Frecuentes
            </h4>
            <div style={{display: 'grid', gap: 12}}>
              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4}}>¿Los puntos expiran?</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>No, los puntos nunca expiran mientras mantengas actividad en tu cuenta (compras cada 2 años).</p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4}}>¿Cuándo se aplica el descuento?</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>El descuento se aplica automáticamente en tu próxima compra después de canjear los puntos.</p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4}}>¿Puedo canjear puntos parcialmente?</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>Sí, puedes canjear en múltiplos de 100 puntos. Usa los botones + y − para ajustar la cantidad.</p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4}}>¿Puedo transferir puntos?</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>Los puntos son personales y no pueden transferirse. Pero los descuentos aplican a toda tu familia con tu tarjeta.</p>
              </div>

              <div style={{padding: '12px', background: '#1f2937', borderRadius: 8, border: '1px solid #374151'}}>
                <p style={{fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4}}>¿Cuánto tiempo son válidos los descuentos?</p>
                <p style={{fontSize: 12, color: COLORS.textSecondary, margin: 0}}>Los descuentos son válidos por 180 días desde la fecha de canje. Después, caduca el descuento pero no los puntos.</p>
              </div>
            </div>
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
      case 'fidelization':
        return renderFidelizationView();
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
    if (activeView === 'fidelization') return 'Fidelización';
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
      {!(activeView === 'account' || activeView === 'purchases' || activeView === 'payment' || activeView === 'fidelization' || activeView === 'contact' || activeView === 'register') && (
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