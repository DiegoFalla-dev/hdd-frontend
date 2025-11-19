import axios from 'axios';
import type { ConcessionProduct, ProductCategory } from '../types/ConcessionProduct';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hdd-backend-bedl.onrender.com';
const BASE_URL = `${API_BASE}/api/concessions`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getProductsByCinema = async (cinemaId: number): Promise<ConcessionProduct[]> => {
    try {
        console.log('Fetching products for cinema:', cinemaId);
        const response = await api.get('', {
            params: {
                cinema: cinemaId
            }
        });
        console.log('Products response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching concession products:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
            console.error('Request URL:', error.config?.url);
            console.error('Request params:', error.config?.params);
        }
        throw error;
    }
};

export const getProductsByCinemaAndCategory = async (
    cinemaId: number, 
    category: ProductCategory
): Promise<ConcessionProduct[]> => {
    try {
        const response = await api.get(`?cinema=${cinemaId}&category=${category}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching concession products by category:', error);
        throw error;
    }
};

export const getProductById = async (id: number): Promise<ConcessionProduct> => {
    try {
        const response = await api.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching concession product with id ${id}:`, error);
        throw error;
    }
};

export const createProduct = async (product: Omit<ConcessionProduct, 'id'>): Promise<ConcessionProduct> => {
    try {
        const response = await api.post('', product);
        return response.data;
    } catch (error) {
        console.error('Error creating concession product:', error);
        throw error;
    }
};

export const updateProduct = async (id: number, product: ConcessionProduct): Promise<ConcessionProduct> => {
    try {
        const response = await api.put(`/${id}`, product);
        return response.data;
    } catch (error) {
        console.error(`Error updating concession product with id ${id}:`, error);
        throw error;
    }
};

export const deleteProduct = async (id: number): Promise<void> => {
    try {
        await api.delete(`/${id}`);
    } catch (error) {
        console.error(`Error deleting concession product with id ${id}:`, error);
        throw error;
    }
};