import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import type { JwtResponse as ServiceJwtResponse, LoginRequest as ServiceLoginRequest, RegisterRequest as ServiceRegisterRequest } from '../services/authService';
import { getAccessToken, getRefreshToken, clearAuthTokens } from '../utils/storage';
import { prefetchAfterLogin } from '../lib/prefetch';

interface AuthState {
  user: ServiceJwtResponse | null;
  loading: boolean;
  login: (data: ServiceLoginRequest) => Promise<void>;
  register: (data: ServiceRegisterRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ServiceJwtResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicialización desde localStorage
  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const login = useCallback(async (data: ServiceLoginRequest) => {
    const res = await authService.login(data as any);
    if (res.token) {
      setUser(res);
      // intentar leer cine previamente seleccionado para prefetch concesiones
      try {
        const saved = localStorage.getItem('selectedCine');
        const parsed = saved ? JSON.parse(saved) : null;
        await prefetchAfterLogin(parsed?.id);
      } catch {
        await prefetchAfterLogin();
      }
    }
  }, []);

  const register = useCallback(async (data: ServiceRegisterRequest) => {
    await authService.register(data as any);
    const current = authService.getCurrentUser();
    setUser(current);
    if (current?.token) {
      try {
        const saved = localStorage.getItem('selectedCine');
        const parsed = saved ? JSON.parse(saved) : null;
        await prefetchAfterLogin(parsed?.id);
      } catch {
        await prefetchAfterLogin();
      }
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    clearAuthTokens();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getRefreshToken()) return;
    try {
      // apiClient interceptor ya maneja refresh; aquí podría forzar ping protegido
      // opcional: llamar /auth/refresh directamente
    } catch (e) {
      console.warn('Refresh manual failed', e);
      logout();
    }
  }, [logout]);

  const value: AuthState = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
    isAuthenticated: !!user && !!getAccessToken(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
