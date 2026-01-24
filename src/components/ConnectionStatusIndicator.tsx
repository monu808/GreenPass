'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ConnectionState } from '@/types';

interface ConnectionStatusIndicatorProps {
  connectionState: ConnectionState;
  onRetry?: () => void;
  className?: string;
}

/**
 * A compact UI component to display the real-time connection status.
 */
export default function ConnectionStatusIndicator({
  connectionState,
  onRetry,
  className = '',
}: ConnectionStatusIndicatorProps) {
  // Don't show anything if connected (keep UI clean)
  if (connectionState === 'connected') return null;

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Connecting...',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-100',
          iconClass: 'animate-spin',
        };
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection Error',
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-600',
          borderColor: 'border-rose-100',
          iconClass: '',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Offline',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-100',
          iconClass: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-3.5 w-3.5 ${config.iconClass}`} aria-hidden="true" />
      <span>{config.text}</span>
      
      {connectionState === 'error' && onRetry && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRetry();
          }}
          className="ml-1 p-1 hover:bg-rose-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          aria-label="Retry connection"
          title="Retry Connection"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
