"use client";

import { useEffect, useState } from 'react';
import { heartbeatManager, type HeartbeatConfig } from '@/lib/heartbeatManager';

type HeartbeatStatus = 'online' | 'offline' | 'error';

interface UseHeartbeatOptions {
  config?: Partial<HeartbeatConfig>;
  autoStart?: boolean;
  onStatusChange?: (status: HeartbeatStatus) => void;
}

export function useHeartbeat(options: UseHeartbeatOptions = {}) {
  const { config, autoStart = true, onStatusChange } = options;
  const [status, setStatus] = useState<HeartbeatStatus>('offline');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const id = `heartbeat-${Date.now()}-${Math.random()}`;
    
    // Subscribe to status changes
    const unsubscribe = heartbeatManager.subscribe(id, (newStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    });

    // Configure if provided
    if (config) {
      heartbeatManager.configure(config);
    }

    // Auto start if enabled
    if (autoStart) {
      heartbeatManager.start();
      setIsActive(true);
    }

    return () => {
      unsubscribe();
    };
  }, [config, autoStart, onStatusChange]);

  const start = () => {
    heartbeatManager.start();
    setIsActive(true);
  };

  const stop = () => {
    heartbeatManager.stop();
    setIsActive(false);
  };

  const ping = () => {
    return heartbeatManager.ping();
  };

  return {
    status,
    isActive,
    start,
    stop,
    ping,
  };
}
