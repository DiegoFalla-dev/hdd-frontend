import api from './apiClient';
import axios from 'axios';
import type { ConcessionProduct, ProductCategory } from '../types/ConcessionProduct';

export const getProductsByCinema = async (cinemaId: number): Promise<ConcessionProduct[]> => {
    try {
        console.log('Fetching products for cinema:', cinemaId);
        const response = await api.get('/concessions', {
            params: {
                cinema: cinemaId
            }
        });
        console.log('Products response:', response.data);
        return response.data;
    } catch (err: unknown) {
        console.error('Error fetching concession products:', err);
        if (axios.isAxiosError(err)) {
            console.error('Response data:', err.response?.data);
            console.error('Request URL:', err.config?.url);
            console.error('Request params:', err.config?.params);
        }
        throw err;
    }
};

export const getProductsByCinemaAndCategory = async (
    cinemaId: number, 
    category: ProductCategory
): Promise<ConcessionProduct[]> => {
    try {
        const response = await api.get(`/concessions`, { params: { cinema: cinemaId, category } });
        return response.data;
    } catch (error) {
        console.error('Error fetching concession products by category:', error);
        throw error;
    }
};

export const getProductById = async (id: number): Promise<ConcessionProduct> => {
    try {
        const response = await api.get(`/concessions/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching concession product with id ${id}:`, error);
        throw error;
    }
};

export const createProduct = async (product: Omit<ConcessionProduct, 'id'>): Promise<ConcessionProduct> => {
    try {
        const response = await api.post('/concessions', product);
        return response.data;
    } catch (error) {
        console.error('Error creating concession product:', error);
        throw error;
    }
};

export const updateProduct = async (id: number, product: ConcessionProduct): Promise<ConcessionProduct> => {
    try {
        const response = await api.put(`/concessions/${id}`, product);
        return response.data;
    } catch (error) {
        console.error(`Error updating concession product with id ${id}:`, error);
        throw error;
    }
};

export const deleteProduct = async (id: number): Promise<void> => {
    try {
        await api.delete(`/concessions/${id}`);
    } catch (error) {
        console.error(`Error deleting concession product with id ${id}:`, error);
        throw error;
    }
};