import { SupabaseClient } from '@supabase/supabase-js';
import { EcologicalPolicyEngine } from '@/lib/ecologicalPolicyEngine';
import type DatabaseService from '@/lib/databaseService';
import type { Database } from '@/types/database';
import * as mockData from '@/data/mockData';

declare global {
  interface Window {
    __policyEngine?: EcologicalPolicyEngine;
  }

  var __supabaseClient: SupabaseClient | undefined;
  var __mockData: typeof mockData | undefined;
  var __weatherCache: Map<string, Database['public']['Tables']['weather_data']['Row']> | undefined;
  var __dbService: DatabaseService | undefined;
}

export {};
