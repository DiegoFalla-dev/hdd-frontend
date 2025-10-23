// authService.ts

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const STORAGE_TOKEN_KEY = 'token';
export const STORAGE_USER_KEY = 'usuario';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface JwtResponse {
  token?: string;
  id?: number | string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  avatar?: string | null;
  birthDate?: string;
  nationalId?: string;
  phoneNumber?: string;
  gender?: string;
  favoriteCinema?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate?: string;
  nationalId?: string;
  phoneNumber?: string;
  gender?: string;
  favoriteCinema?: string;
  roles?: string[];
  contactPreference?: boolean;
}

async function login(payload: LoginRequest): Promise<JwtResponse> {
  const url = `${API_BASE}/api/auth/login`;
  const res = await axios.post(url, payload);
  const data: JwtResponse = res.data || {};

  if (data.token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    const storedUser = JSON.stringify({
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      roles: data.roles || [],
      avatar: data.avatar ?? null,
      birthDate: data.birthDate ?? null,
      nationalId: data.nationalId ?? null,
      phoneNumber: data.phoneNumber ?? null,
      gender: data.gender ?? null,
      favoriteCinema: data.favoriteCinema ?? null,
    });
    localStorage.setItem(STORAGE_USER_KEY, storedUser);
    window.dispatchEvent(new Event('auth:login'));
  }

  return data;
}

async function register(payload: RegisterRequest) {
  const url = `${API_BASE}/api/auth/register`;
  // ANTES: const { confirmPassword: _confirmPassword, ...bodyToSend } = payload;
  // AHORA: Enviamos todo el payload, ya que el backend espera confirmPassword
  const bodyToSend = { ...payload } as RegisterRequest; 
  
  if (!bodyToSend.roles || bodyToSend.roles.length === 0) bodyToSend.roles = ['USER'];
  try {
    return (await axios.post(url, bodyToSend)).data;
  } catch (_err: unknown) { 
    // Si tu backend tiene /signup como alternativa
    const alt = `${API_BASE}/api/auth/signup`;
    return (await axios.post(alt, bodyToSend)).data; // Asegúrate de que esta alternativa también espera confirmPassword
  }
}

function logout() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new Event('auth:logout'));
}

function getToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getCurrentUser(): JwtResponse | null {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JwtResponse;
  } catch (e) {
    console.error("Error parsing stored user data:", e);
    return null;
  }
  return null;
}

export default {
  login,
  register,
  logout,
  getToken,
  getCurrentUser,
};