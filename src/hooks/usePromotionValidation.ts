import { useMutation } from '@tanstack/react-query';
import promotionService, { type PromotionValidationResponse } from '../services/promotionService';
import { useCartStore } from '../store/cartStore';

export function usePromotionValidation() {
  const applyPromotion = useCartStore((s) => s.applyPromotion);
  const clearPromotion = useCartStore((s) => s.clearPromotion);

  const mutation = useMutation<PromotionValidationResponse, Error, { code: string; amount: number }>({
    mutationFn: ({ code, amount }) => promotionService.validatePromotion(code, amount),
    onSuccess: (response) => {
      if (response.isValid && response.promotion) {
        applyPromotion(response.promotion);
      } else {
        clearPromotion();
      }
    },
    onError: () => {
      clearPromotion();
    },
  });

  return {
    validate: (code: string, amount: number) => mutation.mutate({ code, amount }),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    response: mutation.data,
    promotion: mutation.data?.promotion,
    reset: mutation.reset,
  };
}
