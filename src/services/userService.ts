import api from './apiClient';

export interface NameDto {
  firstName: string;
  lastName: string;
}

export interface UserPurchase {
  id: number;
  userId?: number;
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;           // Nombre de la sala
  showDate?: string;           // Fecha de función YYYY-MM-DD
  showTime?: string;           // Hora de función HH:mm:ss
  showtimeDate?: string;       // ISO timestamp completo
  format?: string;             // 2D, 3D, 4DX, etc.
  totalAmount: number;
  status?: string;
  purchaseDate: string;        // Fecha de compra ISO
  createdAt?: string;          // Alias para purchaseDate
  orderItems?: any[];
  orderConcessions?: any[];
  promotion?: { code?: string; discountAmount?: number };
  discountAmount?: number;
  fidelityDiscountAmount?: number;
}

export interface UserDTO {
  id?: number;
  firstName: string;
  lastName: string;
  nationalId: string; // DNI/Cédula
  email: string;
  birthDate: string; // YYYY-MM-DD
  gender?: string; // Género
  username: string; // Nombre de usuario
  phoneNumber?: string; // Número de celular
  favoriteCinema?: { id: number; name: string; city?: string; address?: string }; // Cine favorito con detalles
  avatar?: string | null;
  roles?: string[]; // ["ROLE_USER"], ["ROLE_MANAGER"], ["ROLE_ADMIN"]
  isValid?: boolean; // Indica si la cuenta ha sido validada
  isActive?: boolean; // Indica si la cuenta está activa
  isTwoFactorEnabled?: boolean; // Autenticación de dos factores
  fidelityPoints?: number; // Puntos de fidelización
  lastPurchaseDate?: string; // Fecha de última compra
  activationTokenExpiry?: string; // Expiración del token de activación
  ruc?: string; // RUC para facturas
  razonSocial?: string; // Razón social para facturas
}

export interface User extends UserDTO {
  id: number;
  paymentMethods?: any[];
}

/**
 * Obtiene el nombre de un usuario por ID
 */
export async function getUserName(id: number | string): Promise<NameDto> {
  const response = await api.get<NameDto>(`/users/${id}/name`);
  return response.data;
}

/**
 * Obtiene todos los usuarios
 */
export async function getAllUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Obtiene un usuario específico por ID
 */
export async function getUserById(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

/**
 * Obtiene el historial de compras de un usuario
 */
export async function getUserPurchases(id: number): Promise<UserPurchase[]> {
  const response = await api.get<any[]>(`/users/${id}/purchases`);
  const orders = Array.isArray(response.data) ? response.data : [];
  
  // Mapear OrderDTO a UserPurchase con los campos de showtime
  return orders.map(order => {
    const firstItem = order.orderItems?.[0];
    const showtime = firstItem?.showtime;
    
    return {
      id: order.id,
      userId: id,
      movieTitle: showtime?.movieTitle || order.movie?.title || 'Película no disponible',
      cinemaName: showtime?.cinemaName || 'Cine no especificado',
      roomName: showtime?.theaterName || 'N/A',
      showDate: showtime?.date || 'N/A',
      showTime: showtime?.time || 'N/A',
      showtimeDate: showtime?.date && showtime?.time 
        ? `${showtime.date}T${showtime.time}` 
        : new Date().toISOString(),
      format: showtime?.format || 'N/A',
      totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : Number(order.totalAmount || 0),
      status: order.orderStatus || 'COMPLETED',
      purchaseDate: order.orderDate || new Date().toISOString(),
      createdAt: order.orderDate || new Date().toISOString(),
      orderItems: order.orderItems || [],
      orderConcessions: order.orderConcessions || [],
      promotion: order.promotion,
      discountAmount: order.discountAmount || 0,
      fidelityDiscountAmount: order.fidelityDiscountAmount || 0,
    };
  });
}

/**
 * Crea un nuevo usuario manualmente (solo admin)
 * Nota: El usuario se crea con contraseña temporal: TempPass123!
 */
export async function createUser(payload: UserDTO): Promise<User> {
  const response = await api.post<User>('/users', payload);
  return response.data;
}

/**
 * Actualiza un usuario existente
 */
export async function updateUser(id: number, payload: Partial<UserDTO>): Promise<User> {
  const response = await api.put<User>(`/users/${id}`, payload);
  return response.data;
}

/**
 * Elimina un usuario
 */
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

/**
 * Activa/Desactiva usuario (solo admin/staff)
 */
export async function setUserActive(userId: number, active: boolean): Promise<void> {
  await api.patch(`/users/${userId}/active`, { active });
}

/**
 * Reenvía correo de activación (solo admin/staff)
 */
export async function resendActivation(userId: number): Promise<void> {
  await api.post(`/users/${userId}/activation/resend`);
}

/**
 * Obtiene el total de usuarios
 */
export async function getUserCount(): Promise<number> {
  const response = await api.get<number>('/users/count');
  return response.data;
}

/**
 * Valida la cuenta de un usuario (marca isValid como true)
 */
export async function validateUserAccount(userId: number): Promise<void> {
  await api.patch(`/users/${userId}/validate`);
}

/**
 * Actualiza los datos de facturación (RUC y Razón Social) de un usuario
 */
export async function updateBillingInfo(userId: number, ruc: string, razonSocial: string): Promise<void> {
  await api.patch(`/users/${userId}/billing-info`, { ruc, razonSocial });
}

export default {
  getUserName,
  getAllUsers,
  getUserById,
  getUserPurchases,
  createUser,
  updateUser,
  deleteUser,
  getUserCount,
  setUserActive,
  resendActivation,
  validateUserAccount,
  updateBillingInfo
};
