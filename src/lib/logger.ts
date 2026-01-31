import { errorReporter } from './errors/errorReportingService';
import { ErrorType } from './errors/types';

/**
 * Interface for structured logging context
 */
export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Production-safe logger utility.
 * Suppresses 'debug' and 'info' logs when running in production environment.
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Helper function to format log messages with timestamp and context
 */
const formatLogMessage = (level: string, message: string, context?: LogContext): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${Object.entries(context)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')}]` : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
};

/**
 * Helper function to map LogContext to ErrorInfo format
 */
const mapContextToErrorInfo = (context?: LogContext) => {
  if (!context) return undefined;
  
  return {
    type: ErrorType.UNKNOWN,
    message: 'Logged error',
    timestamp: Date.now(),
    component: context.component,
    operation: context.operation,
    userId: context.userId,
    requestId: context.requestId,
    metadata: context.metadata,
  };
};

export const logger = {
  // Debug: Only for local development (Detailed object dumps, flow tracing)
  debug: (message: string, contextOrArgs?: LogContext | any[], ...args: any[]) => {
    if (!isProduction) {
      const context = Array.isArray(contextOrArgs) ? undefined : contextOrArgs;
      const actualArgs = Array.isArray(contextOrArgs) ? contextOrArgs : args;
      console.debug(formatLogMessage('DEBUG', message, context), ...actualArgs);
    }
  },

  // Info: General app flow (Startup, job completion)
  // Suppressed in production to prevent log spam
  info: (message: string, contextOrArgs?: LogContext | any[], ...args: any[]) => {
    if (!isProduction) {
      const context = Array.isArray(contextOrArgs) ? undefined : contextOrArgs;
      const actualArgs = Array.isArray(contextOrArgs) ? contextOrArgs : args;
      console.info(formatLogMessage('INFO', message, context), ...actualArgs);
    }
  },

  // Warn: Potential issues that aren't crashes (API rate limits, missing config)
  // Visible in production
  warn: (message: string, contextOrArgs?: LogContext | any[], ...args: any[]) => {
    const context = Array.isArray(contextOrArgs) ? undefined : contextOrArgs;
    const actualArgs = Array.isArray(contextOrArgs) ? contextOrArgs : args;
    console.warn(formatLogMessage('WARN', message, context), ...actualArgs);
  },

  // Error: Critical failures (Database down, API failure)
  // Visible in production
  error: (message: string, errorOrContext?: any | LogContext, context?: LogContext) => {
    // Handle different parameter combinations for backward compatibility
    let actualError: any;
    let actualContext: LogContext | undefined;
    
    if (context !== undefined) {
      // Called with (message, error, context)
      actualError = errorOrContext;
      actualContext = context;
    } else if (errorOrContext && typeof errorOrContext === 'object' && !('message' in errorOrContext) && !('stack' in errorOrContext)) {
      // Called with (message, context)
      actualError = undefined;
      actualContext = errorOrContext as LogContext;
    } else {
      // Called with (message, error)
      actualError = errorOrContext;
      actualContext = undefined;
    }
    
    console.error(formatLogMessage('ERROR', message, actualContext), actualError || '');
    
    // Integrate with error reporting for production environments
    if (isProduction) {
      try {
        // Fire-and-forget pattern - don't await
        errorReporter.captureError(actualError || new Error(message), mapContextToErrorInfo(actualContext));
      } catch (reportingError) {
        // Fallback behavior - if error reporting fails, at least log it
        console.error('Failed to report error to monitoring service:', reportingError);
      }
    }
  }
};