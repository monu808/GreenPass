'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, RotateCcw } from 'lucide-react';
import { errorReporter } from '@/lib/errors/errorReportingService';
import { ErrorType } from '@/lib/errors/types';
import ErrorFallback from './ErrorFallback';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName: string;
  onReset?: () => void;
  fallbackComponent?: ReactNode;
}

interface FormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specialized for form contexts.
 * Provides "Try Again" and "Start Over" recovery options.
 */
export class FormErrorBoundary extends Component<FormErrorBoundaryProps, FormErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FormErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorReporter.captureError(error, {
      type: ErrorType.FORM,
      message: `Form Error in ${this.props.formName}: ${error.message}`,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: Date.now(),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const actions = [
        {
          label: 'Try Again',
          onClick: this.handleReload,
          primary: true,
          icon: RefreshCcw,
        },
        {
          label: 'Start Over',
          onClick: this.handleReset,
          primary: false,
          icon: RotateCcw,
        },
      ];

      return (
        <ErrorFallback
          title={`${this.props.formName} Error`}
          message={this.state.error?.message || 'An error occurred while processing the form.'}
          actions={actions}
          className="my-4 border border-red-100 rounded-xl bg-white shadow-sm"
        />
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;
