import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 60 * 24, // 24 hours default to support long-lived caches
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Disable retries by default for non-idempotent operations (bookings, reviews)
      // Enable retries per-mutation only when server-side idempotency is guaranteed
      retry: 0,
      // Network mode: always attempt mutation even offline (for optimistic updates)
      networkMode: 'always',
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  tourists: ['tourists'] as const,
  touristById: (id: string) => ['tourists', id] as const,
  destinations: ['destinations'] as const,
  destinationById: (id: string) => ['destinations', id] as const,
  capacityResults: ['capacity-results'] as const,
  capacityHistory: (days: number) => ['capacity-history', days] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  reviews: ['reviews'] as const,
  alerts: ['alerts'] as const,
} as const;
