"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CsrfContextType {
  csrfToken: string;
  isLoading: boolean;
}

const CsrfContext = createContext<CsrfContextType>({ 
  csrfToken: '', 
  isLoading: true 
});

export function useCsrfToken() {
  return useContext(CsrfContext);
}

export function CsrfProvider({ children }: { children: ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔧 CsrfProvider: Component mounted');

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        setIsLoading(true);
        console.log('🔧 CsrfProvider: Fetching CSRF token...');
        const response = await fetch('/api/csrf');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔧 CsrfProvider: Got token:', { 
          hasToken: !!data.csrfToken, 
          length: data.csrfToken?.length,
          preview: data.csrfToken ? data.csrfToken.substring(0, 10) + '...' : 'none'
        });
        
        if (data.csrfToken && typeof data.csrfToken === 'string') {
          setCsrfToken(data.csrfToken);
          console.log('🔧 CsrfProvider: Token set successfully');
        } else {
          setCsrfToken('');
          console.log('🔧 CsrfProvider: Invalid token received');
        }
      } catch (error) {
        console.log('🔧 CsrfProvider: Error:', error);
        setCsrfToken('');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCsrfToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ csrfToken, isLoading }}>
      {children}
    </CsrfContext.Provider>
  );
}
