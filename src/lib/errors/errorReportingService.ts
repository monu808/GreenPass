import { ErrorInfo } from './types';

/**
 * Interface for error reporting services.
 */
export interface ErrorReporter {
  captureError(error: unknown, errorInfo?: Partial<ErrorInfo>): void;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(userId: string | null, userInfo?: Record<string, any>): void;
}

/**
 * Development reporter that logs to the console.
 */
class ConsoleErrorReporter implements ErrorReporter {
  captureError(error: unknown, errorInfo?: Partial<ErrorInfo>): void {
    console.group('🔴 Error Captured');
    console.error('Error:', error);
    if (errorInfo) {
      console.info('Context:', errorInfo);
    }
    console.groupEnd();
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'error'): void {
    const icon = level === 'info' ? 'ℹ️' : level === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} [${level.toUpperCase()}]: ${message}`);
  }

  setUser(userId: string | null, userInfo?: Record<string, any>): void {
    console.info('👤 User set for reporting:', userId, userInfo);
  }
}

/**
 * Production placeholder (No-Operation reporter).
 */
class NoOpErrorReporter implements ErrorReporter {
  captureError(): void {}
  captureMessage(): void {}
  setUser(): void {}
}

/**
 * Sentry implementation placeholder (can be expanded later)
 */
// class SentryErrorReporter implements ErrorReporter { ... }

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
    // In production, we could initialize Sentry/LogRocket here
    // For now, use NoOp or a basic production logger
    reporterInstance = new NoOpErrorReporter();
  }

  return reporterInstance;
}

/**
 * Convenience export for the default reporter
 */
export const errorReporter = getErrorReporter();
