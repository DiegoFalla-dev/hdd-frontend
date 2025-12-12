import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from '../utils/storage';

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _requestKey?: string;
}

// Map to handle duplicate request cancellation
const pending = new Map<string, AbortController>();

function buildRequestKey(config: AxiosRequestConfig) {
  return [config.method, config.url, JSON.stringify(config.params || {}), JSON.stringify(config.data || {})].join('|');
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!getRefreshToken()) return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // Backend expects the refresh token as a raw string body and returns a JwtResponseDto
        const rawRefresh = getRefreshToken();
        if (!rawRefresh) return null;
        const resp = await axios.post(API_BASE_URL + '/auth/refresh', rawRefresh, {
          headers: { 'Content-Type': 'text/plain' },
        });
        const data = resp.data as { token?: string; refreshToken?: string };
        // In this backend the new access token comes in `token`
        const newAccess = data.token || (data as any).accessToken || null;
        setAuthTokens({ accessToken: newAccess, refreshToken: data.refreshToken || rawRefresh });
        if (import.meta.env.MODE !== 'production') console.debug('[apiClient] refresh response data:', data);
        return newAccess;
      } catch {
        console.warn('Refresh token failed, clearing tokens');
        clearAuthTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach token & cancel duplicates
api.interceptors.request.use((config: RetryRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    if (import.meta.env.MODE !== 'production') {
      // show masked token in dev to help debugging auth issues
      const tail = token.slice(-6);
      console.debug(`[apiClient] attaching Authorization Bearer ****${tail}`);
    }
  }
  
  // DESHABILITADO: Cancelación de solicitudes duplicadas causa problemas con React
  // const key = buildRequestKey(config);
  // config._requestKey = key;
  // if (pending.has(key)) {
  //   // cancel previous identical request
  //   pending.get(key)!.abort();
  //   pending.delete(key);
  // }
  // const controller = new AbortController();
  // config.signal = controller.signal;
  // pending.set(key, controller);
  
  return config;
});

// Response interceptor: clear pending map & handle 401 refresh
api.interceptors.response.use(
  (response) => {
    // DESHABILITADO: Ya no usamos pending map
    // const cfg = response.config as RetryRequestConfig;
    // if (cfg._requestKey) pending.delete(cfg._requestKey);
    return response;
  },
  async (error) => {
    // DESHABILITADO: Ya no usamos pending map
    // const cfg = error.config as RetryRequestConfig | undefined;
    // if (cfg?._requestKey) pending.delete(cfg._requestKey);
    const cfg = error.config as RetryRequestConfig | undefined;
    const status = error.response?.status;
    if (status === 401 && cfg && !cfg._retry) {
      // debug 401s in dev to understand why backend rejected the request
      if (import.meta.env.MODE !== 'production') {
        console.debug('[apiClient] 401 response data:', error.response?.data);
      }
        if (getRefreshToken()) {
          cfg._retry = true;
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            cfg.headers = cfg.headers || {};
            if (cfg.headers) {
              (cfg.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
            }
            return api(cfg); // retry
          }
        }

        // If we reach here, refresh either wasn't available or failed. If there is an access token
        // present, it's likely expired/invalid — clear tokens and prompt login modal so user can re-auth.
        try {
          const current = getAccessToken();
          if (current) {
            if (import.meta.env.MODE !== 'production') console.debug('[apiClient] access token invalid or expired, clearing tokens and opening login modal');
            clearAuthTokens();
            try { window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { reason: 'unauthorized' } })); } catch(_) {}
          }
        } catch (e) {
          // ignore
        }
    }
    return Promise.reject(error);
  }
);

export function getAuthHeaders(token?: string) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default api;
