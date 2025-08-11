"use client";
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

type SSRUser = { name?: string; email: string; role?: string } | null;

export default function Navbar({ ssrIsAuthed = false, ssrUser = null }: { ssrIsAuthed?: boolean; ssrUser?: SSRUser }) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Lock to SSR values until hydration completes to avoid mismatches
  const authed = hydrated ? isAuthenticated : ssrIsAuthed;
  const role = hydrated ? (user?.role ?? 'user') : (ssrUser?.role ?? 'user');
  const displayName = hydrated
    ? (user?.name || user?.email.split('@')[0] || '')
    : (ssrUser?.name || ssrUser?.email?.split('@')[0] || '');

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/95 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Forum
            </span>
          </Link>

          {authed && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Acasă
              </Link>
              <Link href="/trending" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Trending
              </Link>
              <Link href="/categories" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Categorii
              </Link>
              <Link href="/create" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Creează
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {authed ? (
            <>
              <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-300">
                Salut, {displayName}
              </span>
              {(hydrated ? hasRole('admin') : role === 'admin') && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  👑 Admin
                </Link>
              )}
              <Link 
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ⚙️ Setări
              </Link>
              <form action="/api/auth/logout" method="POST" className="inline">
                <button
                  type="submit"
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
