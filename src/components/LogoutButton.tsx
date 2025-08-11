"use client";
import { useCsrfContext } from '@/contexts/CsrfContext';
import { toast } from 'react-hot-toast';

export function LogoutButton() {
  const { csrfToken, refreshToken } = useCsrfContext();

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const getCookieToken = () => {
      try {
        const raw = document.cookie.split('; ').find(c => c.startsWith('csrf='))?.split('=')[1];
        return raw ? decodeURIComponent(raw) : '';
      } catch {
        return '';
      }
    };

    const tryLogout = async (token: string) => {
      return fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        credentials: 'include'
      });
    };

    try {
      let token = csrfToken || getCookieToken();
      if (!token) {
        await refreshToken().catch(() => {});
        token = getCookieToken();
      }
      if (!token) {
        toast.error('CSRF token not available');
        return;
      }

      let res = await tryLogout(token);
      if (res.status === 403) {
        // Refresh token and retry once
        await refreshToken().catch(() => {});
        token = getCookieToken();
        if (token) res = await tryLogout(token);
      }

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Logout failed');
      }
    } catch {
      toast.error('Network error during logout');
    }
  };

  return (
    <form onSubmit={handleLogout} className="inline">
      <button 
        type="submit"
        className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
      >
        Logout
      </button>
    </form>
  );
}
