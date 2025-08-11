"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CsrfContextType {
  csrfToken: string;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextType | null>(null);

export { CsrfContext };

export function useCsrfContext() {
  const context = useContext(CsrfContext);
  if (context === null) {
    throw new Error('useCsrfContext must be used within a CsrfProvider');
  }
  return context;
}

export function CsrfProvider({ children }: { children: ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCsrfToken = async () => {
    try {
      // Prefer cookie first to avoid generating multiple tokens
      const fromCookie = document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1];
      if (fromCookie && /^[a-f0-9]{64}$/i.test(decodeURIComponent(fromCookie))) {
        setCsrfToken(decodeURIComponent(fromCookie));
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/csrf');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.csrfToken && typeof data.csrfToken === 'string' && data.csrfToken.length === 64) {
        setCsrfToken(data.csrfToken);
      } else {
        setCsrfToken('');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('CSRF Context fetch error:', error);
      setCsrfToken('');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ csrfToken, isLoading, refreshToken: fetchCsrfToken }}>
      {children}
    </CsrfContext.Provider>
  );
}
