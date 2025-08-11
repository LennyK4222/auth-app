"use client";

import { useEffect } from 'react';
import { useCsrfContext } from '@/contexts/CsrfContext';

export default function Heartbeat() {
  const { csrfToken, isLoading } = useCsrfContext();

  useEffect(() => {
    if (isLoading || !csrfToken) return;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
        });
        
        if (!response.ok) {
          console.log('Heartbeat failed:', response.status);
        }
      } catch (error) {
        console.log('Heartbeat error:', error);
      }
    };

    // Send initial heartbeat after 3 seconds
    const initialTimeout = setTimeout(sendHeartbeat, 3000);
    
    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [csrfToken, isLoading]);

  return null;
}