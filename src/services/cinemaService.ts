import apiClient from './apiClient';
import type { Cinema } from '../types/Cinema';

const api = apiClient; // use central api client

export const getAllCinemas = async (): Promise<Cinema[]> => {
    try {
        console.log('Llamando a la API de cines...');
        const response = await api.get('');
        console.log('Respuesta de la API de cines:', response.data);
        return response.data;
    } catch (err: unknown) {
        console.error('Error detallado al obtener cines:', err);
        const maybe = err as { response?: { data?: unknown }; config?: { url?: string } } | undefined;
        if (maybe && maybe.response) {
            console.error('Detalles de la respuesta:', maybe.response.data);
            console.error('URL de la solicitud:', maybe.config?.url);
        }
        throw err;
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