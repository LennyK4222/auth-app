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

    // quick initial probe and tighter interval for responsiveness
    const initialTimeout = setTimeout(sendHeartbeat, 1000);
    const interval = setInterval(sendHeartbeat, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [csrfToken, isLoading, router]);

  return null;
}