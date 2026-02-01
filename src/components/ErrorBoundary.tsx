'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { errorReporter } from '@/lib/errors/errorReportingService';
import { ErrorType } from '@/lib/errors/types';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Report to error monitoring service
    try {
      const componentName = errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown';
      errorReporter.captureError(error, {
        type: ErrorType.UNKNOWN,
        message: error.message,
        timestamp: Date.now(),
        componentStack: errorInfo.componentStack,
        component: componentName,
        operation: 'render'
      });
    } catch (reportingError) {
      // Fallback if error reporting fails
      console.error('Failed to report error to monitoring service:', reportingError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message.includes('Refresh Token') 
                ? 'Your session has expired. Please sign in again.'
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
