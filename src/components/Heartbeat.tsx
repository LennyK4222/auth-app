"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfContext } from '@/contexts/CsrfContext';

export default function Heartbeat() {
  const { csrfToken, isLoading } = useCsrfContext();
  const router = useRouter();

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
          credentials: 'include',
        });
        
        if (response.ok) {
          // notify listeners that presence was updated
          try { window.dispatchEvent(new CustomEvent('heartbeat-ok')); } catch {}
        } else if (response.status === 401) {
          // session invalidated elsewhere: clear cookie and redirect
          try {
            document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          } catch {}
          router.push('/login');
          return; // stop scheduling further heartbeats
        } else {
          console.log('Heartbeat failed:', response.status);
        }
      } catch (error) {
        console.log('Heartbeat error:', error);
      }
    };

    // ⚡ OPTIMIZED: Quick initial probe and optimal interval
    const initialTimeout = setTimeout(sendHeartbeat, 2000);
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState !== 'visible') return; // pause when hidden
        void sendHeartbeat();
      }, 45000); // 45s - reduced frequency since we have cache
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    start();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(initialTimeout);
  stop();
  document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [csrfToken, isLoading, router]);

  return null;
}