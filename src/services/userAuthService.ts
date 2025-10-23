import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Storage keys
const STORAGE_TOKEN_KEY = 'token';
const STORAGE_USER_KEY = 'usuario';

// Types
export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface JwtResponse {
    token: string;
    id: number;
    username: string;
    email: string;
    roles: string[];
    type?: string;
}

export interface UserInfo {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    avatar: string;
    gender: 'Masculino' | 'Femenino';
    nationalId: string;
    roles: string[];
}

export interface UpdateUserRequest {
    birthDate?: string;
    avatar?: string;
    gender?: 'Masculino' | 'Femenino';
    nationalId?: string;
}

// Add token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global response interceptor: if backend returns 401, clear session and redirect to home
api.interceptors.response.use(
    response => response,
    (error: unknown) => {
        try {
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const resp = (error as Record<string, unknown>)['response'] as Record<string, unknown> | undefined;
                if (resp && typeof resp['status'] === 'number' && resp['status'] === 401) {
                    // clear stored auth
                    logout();
                    // redirect to home (or login) after 10s to allow user to read the message
                    if (typeof window !== 'undefined') {
                        setTimeout(() => { window.location.href = '/'; }, 20000);
                    }
                }
            }
        } catch {
            // swallow
        }
        return Promise.reject(error);
    }
);

// Auth functions
async function login(payload: LoginRequest): Promise<JwtResponse> {
    const resp = await api.post<JwtResponse>('/api/auth/login', payload);
    const data = resp.data;
    // Backend may return the JWT under different field names (token, accessToken, jwt, access_token)
    // Try common alternatives so the frontend works with different backends.
    const dataRec = data as unknown as Record<string, unknown>;
    const tokenCandidate = (typeof dataRec['token'] === 'string' && dataRec['token'])
        || (typeof dataRec['accessToken'] === 'string' && dataRec['accessToken'])
        || (typeof dataRec['access_token'] === 'string' && dataRec['access_token'])
        || (typeof dataRec['jwt'] === 'string' && dataRec['jwt'])
        || (typeof dataRec['tokenValue'] === 'string' && dataRec['tokenValue']);
    // Debug available fields (do not print token value)
    try {
        const keys = Object.keys(data || {});
        console.debug('[userAuthService] login response fields:', keys);
    } catch {
        // ignore
    }
    if (!tokenCandidate) {
        throw new Error('Login response did not include a token');
    }
    // persist token and minimal user info
    localStorage.setItem(STORAGE_TOKEN_KEY, tokenCandidate);

    // Normalize user info from common response shapes
    const storedUser = {
        id: typeof dataRec['id'] === 'number' ? (dataRec['id'] as number) : (typeof dataRec['userId'] === 'number' ? (dataRec['userId'] as number) : (dataRec['user'] && typeof (dataRec['user'] as Record<string, unknown>)['id'] === 'number' ? ((dataRec['user'] as Record<string, unknown>)['id'] as number) : undefined)),
        username: typeof dataRec['username'] === 'string' ? (dataRec['username'] as string) : (typeof dataRec['name'] === 'string' ? (dataRec['name'] as string) : (dataRec['user'] && typeof (dataRec['user'] as Record<string, unknown>)['username'] === 'string' ? ((dataRec['user'] as Record<string, unknown>)['username'] as string) : (typeof dataRec['email'] === 'string' ? (dataRec['email'] as string) : undefined))),
        email: typeof dataRec['email'] === 'string' ? (dataRec['email'] as string) : (dataRec['user'] && typeof (dataRec['user'] as Record<string, unknown>)['email'] === 'string' ? ((dataRec['user'] as Record<string, unknown>)['email'] as string) : undefined),
        roles: Array.isArray(dataRec['roles']) ? (dataRec['roles'] as string[]) : (Array.isArray(dataRec['authorities']) ? (dataRec['authorities'] as string[]) : (dataRec['user'] && Array.isArray((dataRec['user'] as Record<string, unknown>)['roles']) ? ((dataRec['user'] as Record<string, unknown>)['roles'] as string[]) : [])),
    };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(storedUser));
    return data;
}

async function register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    birthDate?: string;
    gender?: 'Masculino' | 'Femenino';
    nationalId?: string;
    avatar?: string;
}): Promise<UserInfo> {
    const resp = await api.post<UserInfo>('/api/auth/register', payload);
    return resp.data;
}

function logout() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
}

// User data functions
async function getCurrentUser(): Promise<UserInfo> {
    // Debug: token presence (do not log token itself)
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    try {
        console.debug('[userAuthService] getCurrentUser: tokenPresent=', Boolean(token), 'tokenLen=', token ? token.length : 0);
    } catch {
        // ignore
    }

    // Try a 'me' endpoint first (some backends expose /api/users/me using the JWT subject)
    try {
        const respMe = await api.get<UserInfo>(`/api/users/me`);
        return respMe.data;
    } catch (err) {
        // If /me is not available or returns unauthorized, fallback to id-based lookup
        const e = err as unknown;
        let status: number | undefined;
        if (typeof e === 'object' && e !== null && 'response' in e) {
            const resp = (e as Record<string, unknown>)['response'] as Record<string, unknown> | undefined;
            if (resp && typeof resp['status'] === 'number') status = resp['status'] as number;
        }

        // For 401/404 try the id-based endpoint as a fallback
        if (status === 401 || status === 404) {
            const stored = localStorage.getItem(STORAGE_USER_KEY);
            if (!stored) throw new Error('No user logged in');
            const user = JSON.parse(stored);
            if (!user?.id) throw new Error('Invalid user data');
            const response = await api.get<UserInfo>(`/api/users/${user.id}`);
            return response.data;
        }

        // otherwise rethrow
        throw err;
    }
}

async function updateUser(userId: number, data: UpdateUserRequest): Promise<UserInfo> {
    // Validate before sending
    if (data.birthDate && !validateBirthDate(data.birthDate)) {
        throw new Error('Debes ser mayor de 16 años');
    }
    if (data.nationalId && !validateNationalId(data.nationalId)) {
        throw new Error('DNI debe tener máximo 8 dígitos');
    }
    
    const response = await api.put<UserInfo>(`/api/users/${userId}`, data);
    return response.data;
}

// Validation helpers
export function validateBirthDate(date: string): boolean {
    const birthDate = new Date(date);
    const today = new Date();
    const minAge = 16;
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= minAge;
}

export function validateNationalId(id: string): boolean {
    return /^\d{1,8}$/.test(id);
}

export async function validateAvatar(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(img.width === 600 && img.height === 400);
        };
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
    });
}

// Helper to check current auth state
function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(STORAGE_TOKEN_KEY));
}

function getStoredUser(): { id?: number; username?: string; email?: string; roles?: string[] } | null {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export default {
    // Auth methods
    login,
    register,
    logout,
    isAuthenticated,
    getStoredUser,
    
    // User data methods
    getCurrentUser,
    updateUser,
    
    // Validation helpers
    validateBirthDate,
    validateNationalId,
    validateAvatar
};