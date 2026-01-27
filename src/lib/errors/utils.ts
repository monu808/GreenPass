import { ErrorType } from './types';

/**
 * Categorizes errors by type based on their message, name, or properties.
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('login') || message.includes('permission')) {
      return ErrorType.AUTH;
    }
    if (message.includes('form') || message.includes('validation') || message.includes('invalid') || name === 'validationerror') {
      return ErrorType.FORM;
    }
    if (message.includes('chart') || message.includes('recharts') || message.includes('canvas') || message.includes('rendering')) {
      return ErrorType.CHART;
    }
    if (message.includes('fetch') || message.includes('loading') || message.includes('get') || message.includes('post')) {
      return ErrorType.DATA_FETCH;
    }
  }

  // Check for common error properties or shapes (e.g., from axios or fetch responses)
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.status === 401 || err.status === 403) return ErrorType.AUTH;
    if (err.status >= 500 || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') return ErrorType.NETWORK;
    if (err.name === 'ValidationError' || err.status === 400) return ErrorType.FORM;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Creates user-friendly messages based on the error type and original error.
 */
export function formatErrorMessage(error: unknown, type: ErrorType): string {
  if (typeof error === 'string') return error;
  
  const baseMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  switch (type) {
    case ErrorType.FORM:
      return `Validation Error: ${baseMessage}. Please check your input and try again.`;
    case ErrorType.DATA_FETCH:
      return `Data Loading Error: ${baseMessage}. We couldn't retrieve the requested information.`;
    case ErrorType.CHART:
      return `Visualization Error: ${baseMessage}. There was a problem rendering the data visualization.`;
    case ErrorType.NETWORK:
      return `Network Error: ${baseMessage}. Please check your internet connection and try again.`;
    case ErrorType.AUTH:
      return `Authentication Error: ${baseMessage}. Please sign in again to continue.`;
    case ErrorType.UNKNOWN:
    default:
      return `Unexpected Error: ${baseMessage}. Our team has been notified.`;
  }
}

/**
 * Determines if an error is retryable based on its type and properties.
 */
export function isRetryableError(error: unknown, type: ErrorType): boolean {
  // Network and data fetch errors are generally retryable
  if (type === ErrorType.NETWORK || type === ErrorType.DATA_FETCH) {
    return true;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    // Common retryable HTTP status codes: 408 (Timeout), 429 (Too Many Requests), 
    // 500 (Internal Server Error), 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
    if ([408, 429, 500, 502, 503, 504].includes(err.status)) return true;
  }
  
  return false;
}
