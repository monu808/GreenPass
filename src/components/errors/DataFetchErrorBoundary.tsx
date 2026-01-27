'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { errorReporter } from '@/lib/errors/errorReportingService';
import { ErrorType } from '@/lib/errors/types';
import { classifyError, isRetryableError } from '@/lib/errors/utils';
import ErrorFallback from './ErrorFallback';

interface DataFetchErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  maxRetries?: number;
  retryDelay?: number;
  fallbackComponent?: ReactNode;
}

interface DataFetchErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Error boundary specialized for data fetching.
 * Features automatic retry with exponential backoff and loading states.
 */
export class DataFetchErrorBoundary extends Component<DataFetchErrorBoundaryProps, DataFetchErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: DataFetchErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DataFetchErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = classifyError(error);
    
    // Report error asynchronously without blocking the UI
    errorReporter.captureError(error, {
      type: errorType,
      message: `Data Fetch Error: ${error.message}`,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: Date.now(),
    }).catch(err => {
      console.error('Failed to report data fetch error:', err);
    });

    const maxRetries = this.props.maxRetries ?? 3;
    
    if (isRetryableError(error, errorType) && this.state.retryCount < maxRetries) {
      this.attemptRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  attemptRetry = () => {
    const { retryCount } = this.state;
    const { retryDelay = 1000 } = this.props;
    
    // Exponential backoff: delay * 2^retryCount
    const backoffDelay = retryDelay * Math.pow(2, retryCount);

    this.setState({ isRetrying: true });

    this.retryTimer = setTimeout(() => {
      this.reset();
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }, backoffDelay);
  };

  reset = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: prevState.hasError ? prevState.retryCount + 1 : 0,
    }));
  };

  handleManualRetry = () => {
    this.setState({ retryCount: 0 }); // Reset count for manual attempt
    this.reset();
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    const { hasError, error, isRetrying, retryCount } = this.state;
    const maxRetries = this.props.maxRetries ?? 3;

    if (isRetrying) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            Retrying... (Attempt {retryCount + 1} of {maxRetries})
          </p>
        </div>
      );
    }

    if (hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const actions = [
        {
          label: 'Retry Now',
          onClick: this.handleManualRetry,
          primary: true,
        },
      ];

      return (
        <ErrorFallback
          title="Data Loading Failed"
          message={error?.message || "We couldn't load the data. Please check your connection."}
          actions={actions}
          icon={RefreshCw}
          className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200"
        />
      );
    }

    return this.props.children;
  }
}

export default DataFetchErrorBoundary;
