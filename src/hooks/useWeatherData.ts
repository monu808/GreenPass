'use client';

import { useQuery } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';

export function useWeatherData(destinationId: string | null) {
  return useQuery({
    queryKey: ['weather', destinationId],
    queryFn: async () => {
      if (!destinationId) return null;
      const dbService = getDbService();
      return await dbService.getLatestWeatherData(destinationId);
    },
    enabled: !!destinationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWeatherDataBatch(destinationIds: string[]) {
  return useQuery({
    queryKey: ['weather', 'batch', destinationIds],
    queryFn: async () => {
      if (!destinationIds.length) return new Map();
      const dbService = getDbService();
      return await dbService.getWeatherDataForDestinations(destinationIds);
    },
    enabled: destinationIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
