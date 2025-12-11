import { QueryClient } from '@tanstack/react-query';

// Central QueryClient configuration. Tune staleTime per key via hooks when needed.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // No retry en errores 4xx (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        // Retry hasta 3 veces en errores de red/servidor
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch cuando se recupera la conexión
      staleTime: 60 * 1000, // 1 min default; override in specific hooks for heavier data.
      gcTime: 5 * 60 * 1000, // Cache garbage collection after 5 min
    },
    mutations: {
      retry: (failureCount, error) => {
        // No retry en errores de validación (4xx)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        // Solo 1 retry en mutaciones para evitar duplicados
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});
