"use client";
import { useCsrfContext } from '@/contexts/CsrfContext';
import { toast } from 'react-hot-toast';

export function LogoutButton() {
  const { csrfToken } = useCsrfContext();

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csrfToken) {
      toast.error('CSRF token not available');
      return;
    }

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (res.ok) {
        // Redirect to login page or home
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
