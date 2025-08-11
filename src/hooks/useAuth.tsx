"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
    await load();
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initial load
    void load();

    // Refresh on heartbeat-ok events
    const onBeat = () => { void refresh(); };
    window.addEventListener('heartbeat-ok', onBeat);

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
      window.removeEventListener('heartbeat-ok', onBeat);
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
