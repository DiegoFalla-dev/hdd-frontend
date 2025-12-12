// util para manejo seguro de localStorage
import type { JwtResponse } from '../types/Auth.ts';
import type { User } from '../types/User.ts';

const SAFE_PREFIX = 'cineplus:';
const LOCAL_STORAGE_KEY = 'usuario';
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

export function getFavoriteCinema(): string | null {

  const userDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!userDataString){
    console.warn(`La clave '${LOCAL_STORAGE_KEY}' no existe en localStorage.`);
    return null;
  }try {
    const userObject: User = JSON.parse(userDataString) as User;
    return userObject.favoriteCinema || null;
  } catch (error) {
    console.error('Error al parsear el JSON de usuario en localStorage: ', error);
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
  clearOrderStorage,
  clearAllAppStorage,
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

// Clears order-related data from localStorage without affecting auth tokens
export function clearOrderStorage() {
  try {
    // Only remove specific order-related keys - be conservative!
    const orderKeys = [
      'pendingOrder',
      'selectedEntradas',
      'cartStore',
      'seatSelections',
      'movieSelection',
      'showtimeSelection',
    ];
    
    orderKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore individual key errors
      }
    });
    
    console.log('✓ Order storage cleared');
  } catch (e) {
    console.warn('clearOrderStorage failed', e);
  }
}

// Clears all local storage related to the app and session, and best-effort caches
export async function clearAllAppStorage() {
  try {
    // Remove auth tokens first
    clearAuthTokens();
    // Clear known app keys
    try { localStorage.removeItem('selectedCine'); } catch {}
    // Fallback: clear entire localStorage/sessionStorage for a hard reset
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    // Best-effort clear of Cache Storage (service worker caches)
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
  } catch (e) {
    console.warn('clearAllAppStorage encountered an issue', e);
  }
}

