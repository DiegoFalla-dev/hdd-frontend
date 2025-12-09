import api from './apiClient';
import axios from 'axios';
import type { Cinema } from '../types/Cinema';

export const getAllCinemas = async (): Promise<Cinema[]> => {
    try {
        console.log('Llamando a la API de cines...');
        const response = await api.get('/cinemas');
        console.log('Respuesta de la API de cines:', response.data);
        return response.data;
    } catch (error) {
        // If request was canceled, re-throw the error instead of returning empty array
        // This allows the caller to handle cancellation properly
        if (axios.isAxiosError(error) && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) {
            console.warn('getAllCinemas: request was canceled');
            throw error; // Re-throw para que el componente pueda manejar la cancelación
        }
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
        const response = await api.get(`/cinemas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching cinema with id ${id}:`, error);
        throw error;
    }
};

export const createCinema = async (cinema: Omit<Cinema, 'id'>): Promise<Cinema> => {
    try {
        const response = await api.post('/cinemas', cinema);
        return response.data;
    } catch (error) {
        console.error('Error creating cinema:', error);
        throw error;
    }
};

export const updateCinema = async (id: number, cinema: Cinema): Promise<Cinema> => {
    try {
        const response = await api.put(`/cinemas/${id}`, cinema);
        return response.data;
    } catch (error) {
        console.error(`Error updating cinema with id ${id}:`, error);
        throw error;
    }
};

export const deleteCinema = async (id: number): Promise<void> => {
    try {
        await api.delete(`/cinemas/${id}`);
    } catch (error) {
        console.error(`Error deleting cinema with id ${id}:`, error);
        throw error;
    }
};