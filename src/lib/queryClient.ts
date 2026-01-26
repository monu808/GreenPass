import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 60 * 24, // 24 hours default to support long-lived caches
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Centralized React Query keys to keep cache usage consistent across hooks
export const queryKeys = {
  tourists: ['tourists'] as const,
  destinations: ['destinations'] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  capacityResults: ['capacityResults'] as const,
  reviews: ['reviews'] as const,
};
