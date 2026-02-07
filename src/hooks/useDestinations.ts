'use client';

import { useQuery } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';
import { Destination } from '@/types';

export function useDestinations() {
   return useQuery<Destination[]>({
    queryKey: ['destinations'],
    queryFn: async () => {
      const dbService = getDbService();
      return await dbService.getDestinations();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
