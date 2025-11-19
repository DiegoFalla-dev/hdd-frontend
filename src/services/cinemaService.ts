import axios from 'axios';
import type { Cinema } from '../types/Cinema';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hdd-backend-bedl.onrender.com';
const BASE_URL = `${API_BASE}/api/cinemas`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAllCinemas = async (): Promise<Cinema[]> => {
    try {
        console.log('Llamando a la API de cines...');
        const response = await api.get('');
        console.log('Respuesta de la API de cines:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error detallado al obtener cines:', error);
        if (axios.isAxiosError(error)) {
            console.error('Detalles de la respuesta:', error.response?.data);
            console.error('URL de la solicitud:', error.config?.url);
        }
        throw error;
    }
};

export const getCinemaById = async (id: number): Promise<Cinema> => {
    try {
        const response = await api.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching cinema with id ${id}:`, error);
        throw error;
    }
};

export const createCinema = async (cinema: Omit<Cinema, 'id'>): Promise<Cinema> => {
    try {
        const response = await api.post('', cinema);
        return response.data;
    } catch (error) {
        console.error('Error creating cinema:', error);
        throw error;
    }
};

export const updateCinema = async (id: number, cinema: Cinema): Promise<Cinema> => {
    try {
        const response = await api.put(`/${id}`, cinema);
        return response.data;
    } catch (error) {
        console.error(`Error updating cinema with id ${id}:`, error);
        throw error;
    }
};

export const deleteCinema = async (id: number): Promise<void> => {
    try {
        await api.delete(`/${id}`);
    } catch (error) {
        console.error(`Error deleting cinema with id ${id}:`, error);
        throw error;
    }
};