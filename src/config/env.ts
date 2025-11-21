// Centralized environment variable handling
// Ensures a normalized API base URL and warns when missing.

function normalizeBase(url: string): string {
  return url.replace(/\/$/, '') + '/api';
}

export const API_BASE_URL: string = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw || raw.trim() === '') {
    console.warn('VITE_API_BASE_URL no definida. Usando fallback https://hdd-backend-bedl.onrender.com/api');
    return 'https://hdd-backend-bedl.onrender.com/api';
  }
  return normalizeBase(raw.trim());
})();
