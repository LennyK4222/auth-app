"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export function Heartbeat({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  const { csrfToken, isLoading } = useCsrfToken();
  
  useEffect(() => {
    if (isLoading || !csrfToken) return; // Wait for CSRF token to be available
    
    let timer: any;
    const tick = async () => {
      try {
        const res = await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken },
          credentials: 'include',
        });
        
        if (res.ok) {
          // Notify listeners that presence was updated
          window.dispatchEvent(new CustomEvent('heartbeat-ok'));
        } else if (res.status === 401) {
          // Session is invalid, redirect to login
          console.log('Session invalid, redirecting to login');
          
          // Show notification
          toast.error('Sesiunea ta a expirat. Te redirectez la login...');
          
          // Clear any existing auth cookies
          document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          
          // Small delay to show the toast before redirecting
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          
          return; // Don't schedule next tick
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
      timer = setTimeout(tick, intervalMs);
    };
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [intervalMs, router, csrfToken, isLoading]); // Add isLoading to dependencies
  
  return null;
}
