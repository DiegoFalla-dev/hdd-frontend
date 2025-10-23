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

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    birthDate?: string; // ISO date string
    nationalId?: string;
    roles?: string[];
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

async function register(payload: RegisterRequest): Promise<any> {
    // Register should call the backend register/signup endpoint.
    // Use /api/auth/register as primary; include default role USER if not provided.
    const body: RegisterRequest = { ...payload };
    if (!body.roles) body.roles = ['USER'];
    try {
        const resp = await api.post('/api/auth/register', body);
        return resp.data;
    } catch (_err) {
        // If backend uses /api/auth/signup instead, try that as a fallback.
        const resp = await api.post('/api/auth/signup', body);
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
