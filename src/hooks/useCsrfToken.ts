import { useState, useEffect } from 'react';

// Global singleton state to prevent multiple CSRF requests
let globalCsrfToken: string = '';
let globalIsLoading: boolean = false;
let globalFetchPromise: Promise<string> | null = null;
let globalListeners: Array<(token: string, loading: boolean) => void> = [];

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>(globalCsrfToken);
  const [isLoading, setIsLoading] = useState<boolean>(globalIsLoading);

  useEffect(() => {
    // Register this hook instance as a listener
    const updateState = (token: string, loading: boolean) => {
      setCsrfToken(token);
      setIsLoading(loading);
    };
    
    globalListeners.push(updateState);
    
    // If we already have a token, use it immediately
    if (globalCsrfToken && !globalIsLoading) {
      setCsrfToken(globalCsrfToken);
      setIsLoading(false);
      return () => {
        globalListeners = globalListeners.filter(l => l !== updateState);
      };
    }

    // If there's already a fetch in progress, wait for it
    if (globalFetchPromise) {
      globalFetchPromise.then((token) => {
        setCsrfToken(token);
        setIsLoading(false);
      }).catch(() => {
        setCsrfToken('');
        setIsLoading(false);
      });
      
      return () => {
        globalListeners = globalListeners.filter(l => l !== updateState);
      };
    }

    // Start new fetch if no token and no fetch in progress
    if (!globalCsrfToken && !globalFetchPromise) {
      globalIsLoading = true;
      setIsLoading(true);
      
      // Notify all listeners that loading started
      globalListeners.forEach(listener => listener('', true));
      
      globalFetchPromise = (async function fetchCsrfToken(): Promise<string> {
        try {
          const response = await fetch('/api/csrf');
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.csrfToken && typeof data.csrfToken === 'string') {
            globalCsrfToken = data.csrfToken;
            globalIsLoading = false;
            
            // Notify all listeners with the new token
            globalListeners.forEach(listener => listener(globalCsrfToken, false));
            
            return globalCsrfToken;
          } else {
            throw new Error('Invalid token received');
          }
        } catch (error) {
          console.error('CSRF fetch error:', error);
          globalCsrfToken = '';
          globalIsLoading = false;
          
          // Notify all listeners of the error
          globalListeners.forEach(listener => listener('', false));
          
          throw error;
        } finally {
          globalFetchPromise = null;
        }
      })();
    }
    
    // Cleanup function
    return () => {
      globalListeners = globalListeners.filter(l => l !== updateState);
    };
  }, []);

  return { csrfToken, isLoading };
}
