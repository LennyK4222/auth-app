import { useState, useEffect } from 'react';

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCsrfToken();
  }, []);

  return { csrfToken, isLoading };
}
