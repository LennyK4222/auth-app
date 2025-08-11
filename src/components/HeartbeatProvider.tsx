"use client";
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCsrfToken } from '@/components/CsrfProvider';

interface HeartbeatContextType {
  isActive: boolean;
}

const HeartbeatContext = createContext<HeartbeatContextType>({ isActive: false });

export function useHeartbeat() {
  return useContext(HeartbeatContext);
}

export function HeartbeatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { csrfToken, isLoading } = useCsrfToken();
  
  console.log('🔧 HeartbeatProvider: Component mounted, token:', csrfToken ? csrfToken.substring(0, 10) + '...' : 'empty');
  
  useEffect(() => {
    // Check if user is authenticated by looking for token cookie
    const hasToken = document.cookie.includes('token=');
    console.log('HeartbeatProvider: hasToken =', hasToken);
    console.log('HeartbeatProvider: csrfToken from context =', csrfToken ? csrfToken.substring(0, 10) + '...' : 'empty');
    
    if (!hasToken) {
      return; // Don't start heartbeat for unauthenticated users
    }
    
    // Wait for CSRF token to be properly loaded and valid
    if (isLoading || !csrfToken || csrfToken === '' || csrfToken === 'undefined' || typeof csrfToken !== 'string') {
      console.log('HeartbeatProvider: CSRF not ready', { isLoading, csrfLength: csrfToken?.length, csrfType: typeof csrfToken });
      return;
    }
    
    // Validate token format before using
    if (!/^[a-f0-9]{64}$/i.test(csrfToken)) {
      console.log('HeartbeatProvider: Invalid CSRF format');
      return;
    }
    
    console.log('HeartbeatProvider: Starting heartbeat with token:', csrfToken.substring(0, 10) + '...');
    
    let timer: NodeJS.Timeout;
    const tick = async () => {
      try {
        const res = await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken },
          credentials: 'include',
        });
        
        console.log('HeartbeatProvider: Heartbeat result =', res.status);
        
        if (res.ok) {
          // Notify listeners that presence was updated
          window.dispatchEvent(new CustomEvent('heartbeat-ok'));
        } else if (res.status === 401) {
          // Session is invalid, redirect to login
          toast.error('Sesiunea ta a expirat. Te redirectez la login...');
          
          // Clear any existing auth cookies
          document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          
          // Small delay to show the toast before redirecting
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          
          return; // Don't schedule next tick
        }
  } catch {
        // Silent error handling for heartbeat
      }
      timer = setTimeout(tick, 10000); // 10 second interval
    };
    
    timer = setTimeout(tick, 1000); // Start after 1 second
    
    return () => {
      clearTimeout(timer);
    };
  }, [router, csrfToken, isLoading]);
  
  return (
    <HeartbeatContext.Provider value={{ isActive: true }}>
      {children}
    </HeartbeatContext.Provider>
  );
}
