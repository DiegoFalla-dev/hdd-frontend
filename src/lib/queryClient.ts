import { QueryClient } from '@tanstack/react-query';

// Central QueryClient configuration. Tune staleTime per key via hooks when needed.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 min default; override in specific hooks for heavier data.
    },
    mutations: {
      retry: 1,
    },
  },
});
