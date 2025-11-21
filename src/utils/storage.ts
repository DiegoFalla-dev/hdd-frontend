// util para manejo seguro de localStorage
import type { JwtResponse } from '../types/Auth.ts';

const SAFE_PREFIX = 'cineplus:';
const ACCESS_TOKEN_KEY = SAFE_PREFIX + 'accessToken';
const REFRESH_TOKEN_KEY = SAFE_PREFIX + 'refreshToken';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('storage: parse error', e);
    return null;
  }
}

// Deprecated legacy selection helpers (cine + movie). Flow migrated to Zustand stores.
// Kept as no-op stubs to avoid accidental runtime import failures during transition.
export function setSelectedCine(_cine: unknown) {
  // deprecado: sin efecto
}
export function getSelectedCine(): null { return null; }
export function clearSelectedCine() {}

export interface MovieSelectionDeprecated { /* legacy shape */ pelicula?: any }
export function setMovieSelection(_sel: MovieSelectionDeprecated) {
  // deprecado: sin efecto
}
export function getMovieSelection(): null { return null; }
export function clearMovieSelection() {}

export default {
  safeParse,
  // deprecated entries maintained for compatibility
  setSelectedCine,
  getSelectedCine,
  clearSelectedCine,
  setMovieSelection,
  getMovieSelection,
  clearMovieSelection,
  // auth token helpers (active)
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
};

// Auth token helpers
export function setAuthTokens(tokens: Pick<JwtResponse, 'accessToken' | 'refreshToken'>) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (e) {
    console.error('setAuthTokens failed', e);
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

