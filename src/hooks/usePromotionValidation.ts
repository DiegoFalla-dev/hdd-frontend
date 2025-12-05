import { useMutation } from '@tanstack/react-query';
import promotionService from '../services/promotionService';
import type { Promotion } from '../types/Promotion';
import { useCartStore } from '../store/cartStore';

export function usePromotionValidation() {
  const applyPromotion = useCartStore((s) => s.applyPromotion);
  const clearPromotion = useCartStore((s) => s.clearPromotion);

  const mutation = useMutation<Promotion, Error, string>({
    mutationFn: (code: string) => promotionService.validatePromotion(code),
    onSuccess: (promotion) => {
      applyPromotion(promotion);
    },
    onError: () => {
      clearPromotion();
    },
  });

  return {
    validate: (code: string) => mutation.mutate(code),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    promotion: mutation.data,
    reset: mutation.reset,
  };
}
