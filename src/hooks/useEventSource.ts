'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionState, EventSourceOptions, UseEventSourceReturn } from '@/types';
import { logger } from '@/lib/logger';

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const DEFAULT_MAX_RETRIES = 5;

/**
 * A custom hook to manage EventSource connections with proper lifecycle handling,
 * error recovery, and exponential backoff.
 * 
 * @param url The URL to connect to via EventSource
 * @param options Configuration options for the connection
 * @returns Connection state and control functions
 */
export function useEventSource(
  url: string | null,
  options: EventSourceOptions = {}
): UseEventSourceReturn {
  const {
    reconnect: autoReconnect = true,
    maxRetries = DEFAULT_MAX_RETRIES,
    heartbeatTimeout = 45000, // Default 45s (server sends every 15s)
    onMessage,
    onStateChange,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const resetHeartbeatTimerRef = useRef<() => void>(() => {});

  // Helper to update state safely and trigger callback
  const updateState = useCallback((newState: ConnectionState) => {
    if (isMountedRef.current) {
      setConnectionState(newState);
      onStateChange?.(newState);
    }
  }, [onStateChange]);

  const disconnect = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (heartbeatTimeoutIdRef.current) {
      clearTimeout(heartbeatTimeoutIdRef.current);
      heartbeatTimeoutIdRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateState('disconnected');
    setError(null);
    retryCountRef.current = 0;
  }, [updateState]);

  const connect = useCallback(() => {
    if (!url) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(`🔌 Connecting to EventSource: ${url}`);
    updateState('connecting');

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log('✅ EventSource connected');
        updateState('connected');
        setError(null);
        retryCountRef.current = 0;
        resetHeartbeatTimerRef.current();
      };

      es.onmessage = (event) => {
        resetHeartbeatTimerRef.current();
        onMessage?.(event);
      };

      es.onerror = (err) => {
        // EventSource error objects are often empty, so we log more context
        logger.error(
          'EventSource error',
          new Error(`EventSource connection failed - state: ${es.readyState === 0 ? 'connecting' : es.readyState === 2 ? 'closed' : 'unknown'}, url: ${es.url}`),
          { component: 'useEventSource', operation: 'connect', metadata: { state: es.readyState === 0 ? 'connecting' : es.readyState === 2 ? 'closed' : 'unknown', url: es.url, error: err } }
        );
        updateState('error');
        setError(new Error('EventSource connection failed'));
        
        es.close();
        eventSourceRef.current = null;

        if (autoReconnect && retryCountRef.current < maxRetries) {
          const delay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
            MAX_RETRY_DELAY
          );
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
          
          timeoutIdRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              retryCountRef.current += 1;
              connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      logger.error(
        'Failed to create EventSource',
        err,
        { component: 'useEventSource', operation: 'connect', metadata: { url } }
      );
      updateState('error');
      setError(err instanceof Error ? err : new Error('Failed to create EventSource'));
    }
  }, [url, autoReconnect, maxRetries, onMessage, updateState]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Update heartbeat timer ref
  useEffect(() => {
    resetHeartbeatTimerRef.current = () => {
      if (heartbeatTimeoutIdRef.current) {
        clearTimeout(heartbeatTimeoutIdRef.current);
      }

      if (heartbeatTimeout > 0 && connectionState === 'connected') {
        heartbeatTimeoutIdRef.current = setTimeout(() => {
          console.warn('💓 Heartbeat timeout - reconnecting...');
          reconnect();
        }, heartbeatTimeout);
      }
    };
  }, [heartbeatTimeout, connectionState, reconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (url) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    connectionState,
    error,
    reconnect,
    disconnect,
  };
}
