/**
 * Production-safe logger utility.
 * Suppresses 'debug' and 'info' logs when running in production environment.
 */
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  // Debug: Only for local development (Detailed object dumps, flow tracing)
  debug: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  // Info: General app flow (Startup, job completion)
  // Suppressed in production to prevent log spam
  info: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  // Warn: Potential issues that aren't crashes (API rate limits, missing config)
  // Visible in production
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  // Error: Critical failures (Database down, API failure)
  // Visible in production
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  }
};