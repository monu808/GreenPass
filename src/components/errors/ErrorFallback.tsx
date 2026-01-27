'use client';

import React from 'react';
import { AlertCircle, LucideIcon } from 'lucide-react';
import { ErrorRecoveryAction } from '@/lib/errors/types';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  actions?: ErrorRecoveryAction[];
  icon?: LucideIcon;
  className?: string;
}

/**
 * A reusable error fallback component for displaying error states and recovery actions.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  actions = [],
  icon: Icon = AlertCircle,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <Icon className="h-12 w-12 text-red-600" aria-hidden="true" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-base text-gray-600 max-w-md mb-8">
        {message}
      </p>
      
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.onClick()}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
                action.primary
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorFallback;
