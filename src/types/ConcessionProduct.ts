export type ProductCategory = 'COMBOS' | 'CANCHITA' | 'BEBIDAS' | 'SNACKS';

export interface ConcessionProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: ProductCategory;
    cinemaId?: number;
    // Propiedades adicionales para validación
    isActive?: boolean;
    stockQuantity?: number;
}