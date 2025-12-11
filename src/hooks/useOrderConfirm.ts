import { useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderConfirmRequest, OrderDTO } from '../services/orderService';

export function useOrderConfirm() {
  const queryClient = useQueryClient();
  
  return useMutation<OrderDTO, Error, OrderConfirmRequest>({
    mutationFn: (payload) => orderService.confirmOrder(payload),
    onMutate: async (variables) => {
      // Optimistic update: Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['order', variables.orderId] });
      
      // Guardar snapshot del estado anterior
      const previousOrder = queryClient.getQueryData<OrderDTO>(['order', variables.orderId]);
      
      // Actualizar optimistically
      if (previousOrder) {
        queryClient.setQueryData<OrderDTO>(['order', variables.orderId], {
          ...previousOrder,
          orderStatus: 'CONFIRMED' as const,
        });
      }
      
      return { previousOrder };
    },
    onError: (err, variables, context) => {
      // Revertir en caso de error
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', variables.orderId], context.previousOrder);
      }
    },
    onSuccess: (data, variables) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(['order', variables.orderId], data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
    },
  });
}
