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

  const refreshRecentUsers = useCallback(async (limit = 8): Promise<void> => {
    console.log('🔍 refreshRecentUsers called from:', new Error().stack?.split('\n')[2]?.trim());
    
    try {
      // Only show loading on initial fetch (empty list) to avoid UI flicker on background refreshes
      setState(prev => (prev.recentUsers.length === 0 ? { ...prev, loadingRecentUsers: true } : prev));

      const res = await fetch(`/api/user/recent?limit=${encodeURIComponent(String(limit))}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load recent users');
      const data = (await res.json()) as { users: AppState['recentUsers'] };
      const fetched = (data.users || []).slice();

      setState(prev => {
        const prevList = prev.recentUsers;
        const fetchedMap = new Map(fetched.map(u => [u.id, u] as const));
        const seen = new Set<string>();

        // Build a merged list preserving previous order; update fields for existing IDs
        const merged: AppState['recentUsers'] = prevList.map(old => {
          const upd = fetchedMap.get(old.id);
          if (upd) {
            seen.add(old.id);
            // If nothing important changed, keep old reference to avoid re-render of that item
            const same = (!!old.online === !!upd.online) &&
              (old.avatar || '') === (upd.avatar || '') &&
              (old.name || old.email) === (upd.name || upd.email);
            return same ? old : { ...old, ...upd };
          }
          // If user disappeared from fetched, keep the old item to avoid visual drop; can prune later if desired
          return old;
        });

        // Append any new users that weren't in previous list
        for (const u of fetched) {
          if (!seen.has(u.id) && !prevList.some(p => p.id === u.id)) {
            merged.push(u);
          }
        }

        // If merged is reference-equal to prevList (all items same refs and no new), avoid state change
        const lengthSame = merged.length === prevList.length;
        let refsSame = lengthSame;
        if (lengthSame) {
          for (let i = 0; i < merged.length; i++) {
            if (merged[i] !== prevList[i]) { refsSame = false; break; }
          }
        }

        if (refsSame) {
          if (!prev.loadingRecentUsers) return prev;
          return { ...prev, loadingRecentUsers: false };
        }
        return { ...prev, recentUsers: merged, loadingRecentUsers: false };
      });
    } catch {
      setState(prev => {
        // Keep existing list; only flip loading flag if needed
        if (!prev.loadingRecentUsers) return prev;
        return { ...prev, loadingRecentUsers: false };
      });
    }
  }, []);

  // Keep recent users fresh: initial load only (disabled interval to prevent reload issues)
  useEffect(() => {
    // Prime on mount once
    if (!state.recentUsers || state.recentUsers.length === 0) {
      void refreshRecentUsers();
    }
  }, [refreshRecentUsers, state.recentUsers]); // Only run once on mount

  // Disabled interval to stop reload issues
  // useEffect(() => {
  //   const id = setInterval(() => { void refreshRecentUsers(); }, 120000); // 2 min
  //   return () => clearInterval(id);
  // }, [refreshRecentUsers]);

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
