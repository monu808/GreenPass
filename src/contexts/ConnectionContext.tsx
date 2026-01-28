'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useEventSource } from '@/hooks/useEventSource';
import { ConnectionState } from '@/types';

interface ConnectionContextType {
  connectionState: ConnectionState;
  reconnect: () => void;
}

type SubscribeFn = (callback: (event: MessageEvent) => void) => () => void;

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);
const SubscriberContext = createContext<SubscribeFn | undefined>(undefined);

/**
 * ConnectionProvider manages a single, shared SSE connection to the weather monitor
 * for the entire application. This prevents multiple connections when navigating
 * between dashboards.
 */
export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Set<(event: MessageEvent) => void>>(new Set());

  // Distribute incoming messages to all registered subscribers
  const handleMessage = useCallback((event: MessageEvent) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in SSE subscriber callback:', err);
      }
    });
  }, []);

  const { connectionState, reconnect } = useEventSource('/api/weather-monitor', {
    onMessage: handleMessage,
    heartbeatTimeout: 45000,
  });

  // Function for components to register their interest in messages
  const subscribe = useCallback((callback: (event: MessageEvent) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ connectionState, reconnect }}>
      <SubscriberContext.Provider value={subscribe}>
        {children}
      </SubscriberContext.Provider>
    </ConnectionContext.Provider>
  );
}

/**
 * useSSE provides access to the shared connection state and allows
 * subscribing to real-time messages.
 * 
 * @param onMessage Optional callback triggered when a message is received
 * @returns connectionState and reconnect function
 */
export function useSSE(onMessage?: (event: MessageEvent) => void) {
  const context = useContext(ConnectionContext);
  const subscribe = useContext(SubscriberContext);

  if (context === undefined || subscribe === undefined) {
    throw new Error('useSSE must be used within a ConnectionProvider');
  }

  useEffect(() => {
    if (onMessage) {
      return subscribe(onMessage);
    }
  }, [onMessage, subscribe]);

  return context;
}
