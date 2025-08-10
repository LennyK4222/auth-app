'use client';

import { useEffect } from 'react';

export function useUserActivity() {
  useEffect(() => {
    const updateLastSeen = async () => {
      try {
        // Get CSRF token first
        const csrfResponse = await fetch('/api/csrf');
        const { token: csrfToken } = await csrfResponse.json();

        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include' // Include cookies
        });
      } catch (error) {
        // Ignore errors silently - heartbeat is non-critical
        console.debug('Heartbeat failed:', error);
      }
    };

    // Update immediately
    updateLastSeen();

    // Update every 5 minutes
    const interval = setInterval(updateLastSeen, 5 * 60 * 1000);

    // Update on visibility change (when user becomes active)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update on user interaction
    // Throttle the activity updates to every 5 minutes
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 5 * 60 * 1000) {
        lastUpdate = now;
        updateLastSeen();
      }
    };

    window.addEventListener('click', throttledUpdate);
    window.addEventListener('scroll', throttledUpdate);
    window.addEventListener('keypress', throttledUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', throttledUpdate);
      window.removeEventListener('scroll', throttledUpdate);
      window.removeEventListener('keypress', throttledUpdate);
    };
  }, []);
}
