import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { logger } from '@/lib/logger'; // ✅ NEW IMPORT

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

if (!supabase) {
  logger.warn('⚠️ Supabase environment variables are missing. Database features will be unavailable.');
}

// Client-side supabase client
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Server-side supabase client
export const createServerComponentClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    logger.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Using null client for server component.');
    return null;
  }
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey
  );
};