'use client';

import { useQuery } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';

export function useTourists() {
  return useQuery({
    queryKey: ['tourists'],
    queryFn: async () => {
      const dbService = getDbService();
      return await dbService.getTourists();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
