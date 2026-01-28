'use client';

import { useQuery } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';

export function useDestinations() {
  return useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const dbService = getDbService();
      const destinations = await dbService.getDestinations();
      return destinations.map(d => dbService.transformDbDestinationToDestination(d));
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
