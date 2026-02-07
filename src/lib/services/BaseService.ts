import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * BaseService
 * 
 * Foundational abstract class for all domain services.
 * Handles common functionality like mock mode detection,
 * Supabase client access, and standardized logging.
 */
export abstract class BaseService {
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Detects if the service should operate in mock data mode.
   * Based on the pattern established in databaseService.ts
   */
  public isPlaceholderMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const useMockEnv = process.env.NEXT_PUBLIC_USE_MOCK_DATA;
    
    // Check if explicitly requested via environment variable
    if (useMockEnv === 'true' || useMockEnv === '1') {
      return true;
    }
    
    // Check for missing/placeholder Supabase configuration
    return !supabase || !url || !key || url.includes('placeholder') || url.includes('your-project');
  }

  /**
   * Protected getter for the Supabase client instance.
   */
  protected get db() {
    return supabase;
  }

  /**
   * Standardized error logging for all services.
   * 
   * @param operation - The name of the method/operation that failed
   * @param error - The error object or message
   * @param metadata - Optional additional context
   */
  protected logError(operation: string, error: unknown, metadata?: Record<string, unknown>): void {
    logger.error(
      `Error in ${this.serviceName}.${operation}`,
      error instanceof Error ? error : null,
      {
        component: this.serviceName,
        operation,
        metadata: {
          ...metadata,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }
    );
  }

  /**
   * Consistent info logging across services.
   * 
   * @param message - The message to log
   */
  protected logInfo(message: string): void {
    console.log(`[${this.serviceName}] ${message}`);
  }
}
