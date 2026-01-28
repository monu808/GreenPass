import { ErrorInfo } from './types';

/**
 * Interface for error reporting services.
 */
export interface ErrorReporter {
  captureError(error: unknown, errorInfo?: Partial<ErrorInfo>): Promise<void>;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): Promise<void>;
  setUser(userId: string | null, userInfo?: Record<string, unknown>): void;
}

/**
 * Development reporter that logs to the console.
 */
class ConsoleErrorReporter implements ErrorReporter {
  async captureError(error: unknown, errorInfo?: Partial<ErrorInfo>): Promise<void> {
    console.group('🔴 Error Captured');
    console.error('Error:', error);
    if (errorInfo) {
      console.info('Context:', errorInfo);
    }
    console.groupEnd();
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'error'): Promise<void> {
    const icon = level === 'info' ? 'ℹ️' : level === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} [${level.toUpperCase()}]: ${message}`);
  }

  setUser(userId: string | null, userInfo?: Record<string, unknown>): void {
    console.info('👤 User set for reporting:', userId, userInfo);
  }
}

/**
 * Production reporter that forwards errors to an external provider or a fallback endpoint.
 */
class ProductionErrorReporter implements ErrorReporter {
  private loggingEndpoint: string | undefined;
  private apiKey: string | undefined;

  constructor() {
    this.loggingEndpoint = typeof window !== 'undefined' 
      ? '/api/report-error' 
      : process.env.LOGGING_ENDPOINT;
    
    // On the server, we use the private API key; on the client, the proxy handles it.
    this.apiKey = typeof window === 'undefined' ? process.env.LOGGING_API_KEY : undefined;
  }

  async captureError(error: unknown, errorInfo?: Partial<ErrorInfo>): Promise<void> {
    const payload = {
      type: 'error',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      context: {
        ...errorInfo,
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side',
        timestamp: Date.now(),
      }
    };

    // If a logging endpoint is configured, send the error via HTTP POST
    if (this.loggingEndpoint) {
      try {
        await fetch(this.loggingEndpoint, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (fetchError) {
        // Fallback to console in production only if the reporting service itself fails
        console.error('Failed to report error to production endpoint:', fetchError);
        console.error('Original Error:', error);
      }
    } else {
      // If no endpoint is configured, we still want to see errors in the console in prod
      // until a proper provider is wired up, but with less detail than Dev
      console.error('[Production Error]:', error, errorInfo);
    }
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'error'): Promise<void> {
    if (!this.loggingEndpoint) {
      console.log(`[Production ${level.toUpperCase()}]: ${message}`);
      return;
    }

    try {
      await fetch(this.loggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
        },
        body: JSON.stringify({
          type: 'message',
          message,
          level,
          context: {
            url: typeof window !== 'undefined' ? window.location.href : 'server-side',
            timestamp: Date.now(),
          }
        }),
      });
    } catch (fetchError) {
      console.error('Failed to report message to production endpoint:', fetchError);
    }
  }

  setUser(userId: string | null, userInfo?: Record<string, unknown>): void {
    // This could be used to set user context in Sentry/LogRocket
    if (!this.loggingEndpoint) {
      console.info('[Production User Context]:', userId, userInfo);
    }
  }
}

let reporterInstance: ErrorReporter | null = null;

/**
 * Factory to get the appropriate error reporter based on the environment.
 */
export function getErrorReporter(): ErrorReporter {
  if (reporterInstance) return reporterInstance;

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    reporterInstance = new ConsoleErrorReporter();
  } else {
    // In production, we use the ProductionErrorReporter which supports
    // both external providers (future expansion) and a fallback HTTP endpoint.
    reporterInstance = new ProductionErrorReporter();
  }

  return reporterInstance;
}

/**
 * Convenience export for the default reporter
 */
export const errorReporter = getErrorReporter();
