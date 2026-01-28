'use client';

import { useQuery } from '@tanstack/react-query';
import { getDbService } from '@/lib/databaseService';

export function usePolicyConfig() {
  return useQuery({
    queryKey: ['policy-config'],
    queryFn: async () => {
      const dbService = getDbService();
      const policyEngine = dbService.getPolicyEngine();
      return policyEngine.getAllPolicies();
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
