import axios from 'axios';
import authService, { STORAGE_TOKEN_KEY } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hdd-backend-bedl.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header from localStorage
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (token && config && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Dispatch logout so UI can update
      try {
        authService.logout();
      } catch (e) {
        // fallback: remove token and dispatch event
        try {
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          window.dispatchEvent(new Event('auth:logout'));
        } catch (err) {
          // ignore
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
