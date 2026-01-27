'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { errorReporter } from '@/lib/errors/errorReportingService';
import { ErrorType } from '@/lib/errors/types';
import { cn } from '@/lib/utils';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartTitle: string;
  fallbackComponent?: ReactNode;
  showRetry?: boolean;
  className?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specialized for charts and visualizations.
 * Renders a placeholder that maintains dashboard visual consistency.
 */
export class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorReporter.captureError(error, {
      type: ErrorType.CHART,
      message: `Chart Error in "${this.props.chartTitle}": ${error.message}`,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: Date.now(),
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div 
          className={cn(
            "flex flex-col items-center justify-center min-h-[300px] w-full bg-gray-50/50 rounded-xl border border-gray-200 p-6 text-center",
            this.props.className
          )}
        >
          <div className="bg-white p-3 rounded-full shadow-sm mb-4">
            <BarChart2 className="h-8 w-8 text-gray-400" />
          </div>
          
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {this.props.chartTitle} Unavailable
          </h4>
          
          <p className="text-xs text-gray-500 max-w-[240px] mb-4">
            There was a problem rendering this chart. The data might be missing or corrupted.
          </p>

          {(this.props.showRetry ?? true) && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry Render
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
