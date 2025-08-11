"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface AppState {
  categories: Array<{
    name: string;
    slug: string;
    count: string;
    color: string;
    icon: string; // Schimbat la string
    description?: string;
  }>;
  posts: Array<{
    id: string;
    title: string;
    body: string;
    authorEmail: string;
    authorName?: string;
    authorId: string;
    commentsCount: number;
    score: number;
    likedByMe: boolean;
    canDelete: boolean;
    createdAt: string;
    category?: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    lastSeenAt?: string | null;
    online?: boolean;
  }>;
  loadingRecentUsers: boolean;
  refreshTrigger: number;
}

interface AppContextType {
  state: AppState;
  updateCategories: (categories: AppState['categories']) => void;
  updatePosts: (posts: AppState['posts']) => void;
  incrementCategoryCount: (categorySlug: string) => void;
  decrementCategoryCount: (categorySlug: string) => void;
  addPost: (post: AppState['posts'][0]) => void;
  removePost: (postId: string) => void;
  setRecentUsers: (users: AppState['recentUsers']) => void;
  refreshRecentUsers: (limit?: number) => Promise<void>;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    categories: [],
    posts: [],
  recentUsers: [],
  loadingRecentUsers: true,
    refreshTrigger: 0
  });

  const updateCategories = useCallback((categories: AppState['categories']) => {
    setState(prev => ({ ...prev, categories }));
  }, []);

  const updatePosts = useCallback((posts: AppState['posts']) => {
    setState(prev => ({ ...prev, posts }));
  }, []);

  const incrementCategoryCount = useCallback((categorySlug: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.slug === categorySlug) {
          const currentCount = parseInt(cat.count) || 0;
          const newCount = currentCount + 1;
          return {
            ...cat,
            count: newCount > 999 ? `${(newCount/1000).toFixed(1)}k` : newCount.toString()
          };
        }
        return cat;
      })
    }));
  }, []);

  const decrementCategoryCount = useCallback((categorySlug: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.slug === categorySlug) {
          const currentCount = Math.max(0, parseInt(cat.count) - 1);
          return {
            ...cat,
            count: currentCount > 999 ? `${(currentCount/1000).toFixed(1)}k` : currentCount.toString()
          };
        }
        return cat;
      })
    }));
  }, []);

  const addPost = useCallback((post: AppState['posts'][0]) => {
    setState(prev => ({
      ...prev,
      posts: [post, ...prev.posts]
    }));
  }, []);

  const removePost = useCallback((postId: string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId)
    }));
  }, []);

  const triggerRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshTrigger: prev.refreshTrigger + 1 }));
  }, []);

  const setRecentUsers = useCallback((users: AppState['recentUsers']) => {
    setState(prev => ({ ...prev, recentUsers: users }));
  }, []);

  const refreshRecentUsers = useCallback(async (limit = 8) => {
    try {
      setState(prev => ({ ...prev, loadingRecentUsers: true }));
      const res = await fetch(`/api/user/recent?limit=${encodeURIComponent(String(limit))}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load recent users');
      const data = (await res.json()) as { users: AppState['recentUsers'] };
      const list = (data.users || [])
        .slice()
        .sort((a, b) => Number(!!b.online) - Number(!!a.online));
      setState(prev => ({ ...prev, recentUsers: list }));
    } catch {
      setState(prev => ({ ...prev, recentUsers: [] }));
    } finally {
      setState(prev => ({ ...prev, loadingRecentUsers: false }));
    }
  }, []);

  // Keep recent users fresh: on heartbeat-ok and as a fallback every 30s
  useEffect(() => {
    const onBeat = () => { void refreshRecentUsers(); };
    window.addEventListener('heartbeat-ok', onBeat);
    const id = setInterval(onBeat, 30000);
    // Prime on mount once
  void refreshRecentUsers();
    return () => {
      window.removeEventListener('heartbeat-ok', onBeat);
      clearInterval(id);
    };
  }, [refreshRecentUsers]);

  return (
    <AppContext.Provider value={{
      state,
      updateCategories,
      updatePosts,
      incrementCategoryCount,
      decrementCategoryCount,
      addPost,
      removePost,
  setRecentUsers,
  refreshRecentUsers,
      triggerRefresh
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
