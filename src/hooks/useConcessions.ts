import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getProductsByCinema } from '../services/concessionService';
import type { ConcessionProduct } from '../types/ConcessionProduct';

export function useConcessions(cinemaId: number | undefined): UseQueryResult<ConcessionProduct[]> {
  return useQuery({
    queryKey: ['concessions', cinemaId],
    queryFn: () => {
      if (cinemaId == null) return Promise.resolve([]);
      return getProductsByCinema(cinemaId);
    },
    enabled: cinemaId != null,
    staleTime: 2 * 60 * 1000, // 2 min - inventario cambia frecuentemente
    refetchInterval: 3 * 60 * 1000, // Refetch cada 3 min para stock actualizado
    select: (products) => {
      // Filtrar productos inactivos o sin stock; si isActive viene indefinido, lo consideramos activo
      return products.filter(p => (p.isActive ?? true) && (p.stockQuantity == null || p.stockQuantity > 0));
    },
  });
}

// Hook para verificar stock disponible de un producto específico
export function useConcessionAvailability(cinemaId: number | undefined, productId: number, quantity: number) {
  const { data: products } = useConcessions(cinemaId);
  
  const product = products?.find(p => p.id === productId);
  
  return {
    isAvailable: product ? (product.stockQuantity == null || product.stockQuantity >= quantity) : false,
    currentStock: product?.stockQuantity ?? 0,
    isActive: product?.isActive ?? false,
    product,
  };
}
