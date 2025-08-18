"use client";

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { apiHub } from '@/lib/apiHub';

export interface SSEEvent {
  type: string;
  action?: string;
  payload?: any;
  id?: string | number;
  ts?: number;
}

export interface UseSSEOptions {
  channels?: string[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  dedupe?: boolean;
  throttleMs?: number;
}

/**
 * Optimized hook for Server-Sent Events with automatic reconnection
 * Uses the centralized apiHub for connection management
 */
export function useSSE(
  onMessage: (event: SSEEvent) => void,
  options: UseSSEOptions = {}
) {
  const {
    channels = ['public'],
    onConnect,
    onDisconnect,
    onError,
    enabled = true,
    dedupe = true,
    throttleMs = 0
  } = options;

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastEventRef = useRef<SSEEvent | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  // Memoize SSE URL with channels
  const sseUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (channels.length > 0) {
      params.set('channels', channels.join(','));
    }
    return `/api/sse?${params.toString()}`;
  }, [channels]);

  // Throttled and deduped message handler
  const handleMessage = useCallback((event: SSEEvent) => {
    // Dedupe identical events
    if (dedupe && lastEventRef.current) {
      if (
        lastEventRef.current.type === event.type &&
        lastEventRef.current.action === event.action &&
        lastEventRef.current.id === event.id &&
        JSON.stringify(lastEventRef.current.payload) === JSON.stringify(event.payload)
      ) {
        return; // Skip duplicate
      }
    }

    // Throttle events if configured
    if (throttleMs > 0) {
      const now = Date.now();
      if (now - lastProcessedTimeRef.current < throttleMs) {
        return; // Skip due to throttling
      }
      lastProcessedTimeRef.current = now;
    }

    lastEventRef.current = event;

    // Handle connection events
    if (event.type === 'connection') {
      onConnect?.();
      return;
    }

    // Pass to user handler
    handlerRef.current(event);
  }, [dedupe, throttleMs, onConnect]);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to SSE stream via apiHub
    try {
      unsubscribeRef.current = apiHub.subscribeSSE(sseUrl, handleMessage);
    } catch (error) {
      console.error('Failed to subscribe to SSE:', error);
      onError?.(error as Error);
    }

    // Cleanup on unmount or deps change
    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
          onDisconnect?.();
        } catch (error) {
          console.error('Error during SSE cleanup:', error);
        }
      }
    };
  }, [sseUrl, handleMessage, enabled, onDisconnect, onError]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (enabled) {
      try {
        unsubscribeRef.current = apiHub.subscribeSSE(sseUrl, handleMessage);
      } catch (error) {
        console.error('Failed to reconnect SSE:', error);
        onError?.(error as Error);
      }
    }
  }, [sseUrl, handleMessage, enabled, onError]);

  return { reconnect };
}

/**
 * Specialized hook for specific event types
 */
export function useSSEChannel<T = any>(
  channel: string,
  eventType: string,
  handler: (data: T) => void,
  options: Omit<UseSSEOptions, 'channels'> = {}
) {
  const handleMessage = useCallback((event: SSEEvent) => {
    if (event.type === eventType) {
      handler(event.payload as T);
    }
  }, [eventType, handler]);

  return useSSE(handleMessage, {
    ...options,
    channels: [channel]
  });
}

/**
 * Hook for listening to multiple event types
 */
export function useSSEMultiple(
  handlers: Record<string, (data: any) => void>,
  options: UseSSEOptions = {}
) {
  const handleMessage = useCallback((event: SSEEvent) => {
    const handler = handlers[event.type];
    if (handler) {
      handler(event.payload);
    }
  }, [handlers]);

  return useSSE(handleMessage, options);
}
