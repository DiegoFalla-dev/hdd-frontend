// authService.ts

import api from './apiClient';
import { setAuthTokens, clearAuthTokens, getAccessToken } from '../utils/storage';

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
  const res = await api.post('/auth/login', payload);
  const dataRaw = res.data || {};
  if (import.meta.env.MODE !== 'production') {
    try {
      console.debug('[authService] login response status:', res.status);
      console.debug('[authService] login response data:', dataRaw);
    } catch (_) {}
  }

  // Detect token in multiple possible fields (token, accessToken, access_token, jwt)
  const maybeToken = (dataRaw && (dataRaw.token || dataRaw.accessToken || dataRaw.access_token || dataRaw.jwt))
    || (Object.values(dataRaw).find((v: any) => typeof v === 'string' && v.split && v.split('.').length === 3) as string | undefined)
    || undefined;

  // If we found a token-like string, normalize to `token` and persist tokens
  if (maybeToken) {
    // attach normalized field so callers relying on `res.token` keep working
    (dataRaw as any).token = maybeToken;
    // also support refresh token fields
    const refresh = (dataRaw.refreshToken || dataRaw.refresh_token) as string | undefined;
    setAuthTokens({ accessToken: maybeToken, refreshToken: refresh });

    // Normalizar roles del backend (e.g., ROLE_ADMIN -> ADMIN, ROLE_MANAGER -> STAFF, ROLE_USER -> USER)
    const rawRoles: string[] = Array.isArray(dataRaw.roles) ? dataRaw.roles : [];
    const normalizedRoles = rawRoles.map(r => {
      if (r === 'ROLE_ADMIN' || r === 'ADMIN') return 'ADMIN';
      if (r === 'ROLE_MANAGER' || r === 'MANAGER' || r === 'STAFF') return 'STAFF';
      if (r === 'ROLE_USER' || r === 'USER') return 'USER';
      return r; // fallback
    });

    const storedUser = JSON.stringify({
      id: dataRaw.id,
      username: dataRaw.username,
      firstName: dataRaw.firstName,
      lastName: dataRaw.lastName,
      email: dataRaw.email,
      roles: normalizedRoles,
      avatar: dataRaw.avatar ?? null,
      birthDate: dataRaw.birthDate ?? null,
      nationalId: dataRaw.nationalId ?? null,
      phoneNumber: dataRaw.phoneNumber ?? null,
      gender: dataRaw.gender ?? null,
      favoriteCinema: dataRaw.favoriteCinema ?? null,
    });
    localStorage.setItem(STORAGE_USER_KEY, storedUser);
    // If backend provided a favorite cinema, set it as the selectedCine in localStorage
    const favCinema = (dataRaw as any).favoriteCinema || (dataRaw as any).favCine || null;
    if (favCinema) {
      try {
        localStorage.setItem('selectedCine', JSON.stringify({ name: favCinema }));
      } catch (_) {}
    }
    window.dispatchEvent(new Event('auth:login'));
  } else {
    // In dev, log the response shape to help debugging missing token
    if (import.meta.env.MODE !== 'production') console.debug('[authService] login response without token:', dataRaw);
  }

  return dataRaw as JwtResponse;
}

async function register(payload: RegisterRequest) {
  const url = `/auth/register`;
  const bodyToSend: Omit<RegisterRequest, 'roles'> = (({ firstName, lastName, email, password, confirmPassword, birthDate, nationalId, phoneNumber, gender, favoriteCinema, contactPreference }) => ({ firstName, lastName, email, password, confirmPassword, birthDate, nationalId, phoneNumber, gender, favoriteCinema, contactPreference }))(payload);
  // Do NOT send roles; let backend assign defaults to avoid ROLE_* mismatch errors
  const resp = await api.post(url, bodyToSend);
  return resp.data;
}

function logout() {
  clearAuthTokens();
  localStorage.removeItem(STORAGE_USER_KEY);
  window.dispatchEvent(new Event('auth:logout'));
}

function getToken(): string | null {
  return getAccessToken();
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