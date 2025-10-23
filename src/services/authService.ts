import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

const STORAGE_TOKEN_KEY = 'token';
const STORAGE_USER_KEY = 'usuario';

async function login(payload: LoginRequest): Promise<JwtResponse> {
    const resp = await api.post<JwtResponse>('/api/auth/login', payload);
    const data = resp.data;
    // persist token and minimal user info
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({ id: data.id, username: data.username, email: data.email, roles: data.roles }));
    return data;
}

async function register(payload: any): Promise<any> {
    // Backend may use /api/auth/signup or /api/auth/register. Try signup first.
    try {
        const resp = await api.post('/api/auth/login', payload);
        return resp.data;
    } catch (err) {
        // fallback to /api/auth/register
        const resp = await api.post('/api/auth/register', payload);
        return resp.data;
    }
}

function logout() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
}

function getToken(): string | null {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getCurrentUser(): { id?: number; username?: string; email?: string; roles?: string[] } | null {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export default { login, register, logout, getToken, getCurrentUser };
