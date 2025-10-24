import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

export function getAuthHeaders(token?: string) {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`
  };
}

export default api;
