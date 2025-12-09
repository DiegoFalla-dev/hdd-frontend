import api from './apiClient';

export interface NameDto {
  firstName: string;
  lastName: string;
}

export interface UserPurchase {
  id: number;
  userId: number;
  movieTitle?: string;
  cinemaName?: string;
  totalAmount: number;
  status?: string;
  createdAt: string;
  items?: any[];
}

export interface UserDTO {
  id?: number;
  firstName: string;
  lastName: string;
  nationalId: string; // DNI/Cédula
  email: string;
  birthDate: string; // YYYY-MM-DD
  avatar?: string | null;
  roles?: string[]; // ["ROLE_USER"], ["ROLE_MANAGER"], ["ROLE_ADMIN"]
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
  const response = await api.get<UserPurchase[]>(`/users/${id}/purchases`);
  return Array.isArray(response.data) ? response.data : [];
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
 * Obtiene el total de usuarios
 */
export async function getUserCount(): Promise<number> {
  const response = await api.get<number>('/users/count');
  return response.data;
}

export default {
  getUserName,
  getAllUsers,
  getUserById,
  getUserPurchases,
  createUser,
  updateUser,
  deleteUser,
  getUserCount
};
