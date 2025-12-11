import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useConcessions } from './useConcessions';
import { useOccupiedSeats } from './useOccupiedSeats';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Hook para validar el carrito completo en tiempo real
 * Verifica stock de productos, disponibilidad de asientos y horarios
 */
export function useCartValidation(cinemaId?: number) {
  const snapshot = useCartStore((s) => s.cartSnapshot());
  const { data: concessions } = useConcessions(cinemaId);
  
  // Obtener asientos ocupados para cada showtime
  const showtimeIds = snapshot.ticketGroups.map(g => g.showtimeId);
  const occupiedSeatsQueries = showtimeIds.map(id => 
    useOccupiedSeats(id)
  );
  
  return useQuery<ValidationResult>({
    queryKey: ['cart-validation', snapshot, concessions, occupiedSeatsQueries.map(q => q.data)],
    queryFn: () => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Validar productos de dulcería
      if (snapshot.concessions.length > 0 && concessions) {
        snapshot.concessions.forEach(item => {
          const product = concessions.find(p => p.id === item.productId);
          
          if (!product) {
            errors.push(`Producto ${item.productId} ya no está disponible`);
            return;
          }
          
          if (!product.isActive) {
            errors.push(`${product.name} ya no está disponible`);
            return;
          }
          
          if (product.stockQuantity != null && product.stockQuantity < item.quantity) {
            if (product.stockQuantity === 0) {
              errors.push(`${product.name} está agotado`);
            } else {
              errors.push(`${product.name}: solo quedan ${product.stockQuantity} unidades (tienes ${item.quantity} en el carrito)`);
            }
          }
        });
      }
      
      // Validar asientos y horarios
      snapshot.ticketGroups.forEach((group, index) => {
        const occupiedSeats = occupiedSeatsQueries[index]?.data || [];
        
        // Verificar si algún asiento seleccionado ya está ocupado
        group.seatCodes.forEach(seatCode => {
          if (occupiedSeats.includes(seatCode)) {
            errors.push(`El asiento ${seatCode} ya no está disponible`);
          }
        });
        
        // Advertencias sobre tiempo
        const now = new Date();
        const showtimeDate = group.showtime ? new Date(group.showtime.showDate) : null;
        
        if (showtimeDate) {
          const fifteenMinutes = 15 * 60 * 1000;
          const thirtyMinutes = 30 * 60 * 1000;
          const timeUntilShowtime = showtimeDate.getTime() - now.getTime();
          
          if (timeUntilShowtime <= 0) {
            errors.push(`La función de ${group.movieTitle || 'la película'} ya comenzó`);
          } else if (timeUntilShowtime < fifteenMinutes) {
            errors.push(`La función comienza en menos de 15 minutos. No se puede completar la compra`);
          } else if (timeUntilShowtime < thirtyMinutes) {
            warnings.push(`La función comienza en menos de 30 minutos. Completa tu compra pronto`);
          }
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },
    enabled: snapshot.ticketGroups.length > 0 || snapshot.concessions.length > 0,
    staleTime: 10 * 1000, // 10s - validación muy dinámica
    refetchInterval: 15 * 1000, // Refetch cada 15s
  });
}
