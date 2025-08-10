'use client';

import { useEffect } from 'react';

export function useUserActivity() {
  useEffect(() => {
    const updateLastSeen = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Failed to update last seen:', error);
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
