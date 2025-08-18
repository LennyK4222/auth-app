"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AuthRole = 'user' | 'admin' | 'moderator';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: AuthRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasRole: (roles: AuthRole | AuthRole[]) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Read CSRF token from cookie (double-submit pattern)
function readCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/i);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

async function ensureCsrfCookie(): Promise<void> {
  try { await fetch('/api/csrf', { cache: 'no-store', credentials: 'include' }); } catch {}
}

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    // Support both { user: payload } and legacy { role, ... }
    const payload = data?.user ?? data ?? null;
    if (!payload) return null;
    const id = payload.sub || payload.id || payload._id || null;
    const email = payload.email || null;
    if (!id || !email) return null;
    const role = (payload.role as AuthRole | undefined) ?? 'user';
    return { id: String(id), email: String(email), name: payload.name ?? null, role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Dedupe/throttle successive refresh calls and share in-flight
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastFetchedRef = useRef<number>(0);
  const MIN_REFRESH_MS = 15_000; // avoid spamming /api/auth/me more often than every 15s

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const me = await fetchMe();
      setUser(me);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auth error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Coalesce if a refresh is already running
    if (inFlightRef.current) return inFlightRef.current;

    // Throttle frequent triggers (heartbeat/focus/visibility)
    const now = Date.now();
    if (now - lastFetchedRef.current < MIN_REFRESH_MS) return;

    const p = (async () => {
      await load();
      lastFetchedRef.current = Date.now();
    })();
    // Store and clear in-flight marker
    inFlightRef.current = p.finally(() => { inFlightRef.current = null; });
    return p;
  }, [load]);

  const logout = useCallback(async () => {
    try {
      // Ensure we have a CSRF cookie and send it as header
      await ensureCsrfCookie();
      const csrf = readCsrfFromCookie();
      const headers: Record<string, string> = {};
      if (csrf) headers['X-CSRF-Token'] = csrf;
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initial load
    void (async () => {
      // Prime CSRF cookie early for subsequent POSTs
      await ensureCsrfCookie();
      await load();
      lastFetchedRef.current = Date.now();
    })();

    // Refresh on focus/visibility
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVis);

    // Fallback periodic refresh
  const id = setInterval(() => { void refresh(); }, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(id);
    };
  }, [load, refresh]);

  const isAuthenticated = !!user;

  const hasRole = useCallback((roles: AuthRole | AuthRole[]) => {
    if (!user?.role) return false;
    const set = Array.isArray(roles) ? roles : [roles];
    return set.includes(user.role);
  }, [user?.role]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    hasRole,
    refresh,
    logout,
  }), [user, loading, error, isAuthenticated, hasRole, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
