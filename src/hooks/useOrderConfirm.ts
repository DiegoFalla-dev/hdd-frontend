import { useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../services/orderService';
import type { OrderConfirmRequest, OrderDTO } from '../services/orderService';

interface OnMutateContext {
  previousOrder?: OrderDTO;
}

export function useOrderConfirm() {
  const queryClient = useQueryClient();
  
  return useMutation<OrderDTO, Error, OrderConfirmRequest, OnMutateContext>({
    mutationFn: (payload) => orderService.confirmOrder(payload),
    onMutate: async (variables) => {
      // Optimistic update: Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['order', variables.userId] });
      
      // Guardar snapshot del estado anterior
      const previousOrder = queryClient.getQueryData<OrderDTO>(['order', variables.userId]);
      
      // Actualizar optimistically
      if (previousOrder) {
        queryClient.setQueryData<OrderDTO>(['order', variables.userId], {
          ...previousOrder,
          orderStatus: 'CONFIRMED' as const,
        });
      }
      
      return { previousOrder };
    },
    onError: (_err, variables, context) => {
      // Revertir en caso de error (err no se usa)
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', variables.userId], context.previousOrder);
      }
    },
    onSuccess: (data, variables) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(['order', variables.userId], data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-purchases'] });
    },
  });
}
