import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiHub } from '@/lib/apiHub';

// Types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: 'user' | 'admin' | 'moderator';
  avatar?: string;
  bio?: string;
  createdAt?: string;
  stats?: {
    posts: number;
    comments: number;
    likes: number;
  };
}

export interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName?: string;
  authorEmail: string;
  authorAvatar?: string;
  authorRole?: string;
  score: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
  category?: string;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  canDelete?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  postCount: number;
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ro' | 'en';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  performance: {
    animations: boolean;
    lazyLoading: boolean;
    prefetch: boolean;
  };
}

// Store state interface
interface GlobalStore {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  
  // Posts state
  posts: Map<string, Post>;
  feedPosts: string[]; // IDs of posts in feed order
  postsLoading: boolean;
  postsError: string | null;
  
  // Categories state
  categories: Category[];
  categoriesLoading: boolean;
  
  // Notifications state
  notifications: Notification[];
  unreadCount: number;
  
  // UI state
  sidebarOpen: boolean;
  modalOpen: string | null;
  activeFilters: {
    category?: string;
    sort?: 'hot' | 'new';
    search?: string;
  };
  
  // Settings
  settings: AppSettings;
  
  // Actions
  actions: {
    // Auth actions
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    
    // Posts actions
    loadPosts: (options?: { category?: string; sort?: string; page?: number }) => Promise<void>;
    addPost: (post: Post) => void;
    updatePost: (id: string, updates: Partial<Post>) => void;
    deletePost: (id: string) => Promise<void>;
    likePost: (id: string) => Promise<void>;
    bookmarkPost: (id: string) => Promise<void>;
    
    // Categories actions
    loadCategories: () => Promise<void>;
    
    // Notifications actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
    
    // UI actions
    toggleSidebar: () => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
    setFilter: (filter: Partial<GlobalStore['activeFilters']>) => void;
    
    // Settings actions
    updateSettings: (settings: Partial<AppSettings>) => void;
    
    // Optimized batch updates
    batchUpdate: (updates: () => void) => void;
  };
}

// Create the store with middleware
export const useGlobalStore = create<GlobalStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
          // Initial state
          user: null,
          isAuthenticated: false,
          authLoading: false,
          
          posts: new Map(),
          feedPosts: [],
          postsLoading: false,
          postsError: null,
          
          categories: [],
          categoriesLoading: false,
          
          notifications: [],
          unreadCount: 0,
          
          sidebarOpen: false,
          modalOpen: null,
          activeFilters: {},
          
          settings: {
            theme: 'dark',
            language: 'ro',
            notifications: {
              enabled: true,
              sound: true,
              desktop: false,
            },
            performance: {
              animations: true,
              lazyLoading: true,
              prefetch: true,
            },
          },
          
          // Actions
          actions: {
            // Auth actions
            setUser: (user) => {
              set((state) => {
                state.user = user;
                state.isAuthenticated = !!user;
              });
            },
            
            login: async (email, password) => {
              set((state) => { state.authLoading = true; });
              try {
                const response = await apiHub.post<{ user: User; token: string }>('/api/auth/login', {
                  email,
                  password,
                });
                
                set((state) => {
                  state.user = response.user;
                  state.isAuthenticated = true;
                  state.authLoading = false;
                });
                
                // Load user data in background
                get().actions.loadCategories();
              } catch (error) {
                set((state) => {
                  state.authLoading = false;
                });
                throw error;
              }
            },
            
            logout: async () => {
              try {
                await apiHub.post('/api/auth/logout');
              } finally {
                set((state) => {
                  state.user = null;
                  state.isAuthenticated = false;
                  state.posts.clear();
                  state.feedPosts = [];
                  state.notifications = [];
                  state.unreadCount = 0;
                });
                
                // Clear API cache
                apiHub.clearCache();
              }
            },
            
            refreshAuth: async () => {
              try {
                const response = await apiHub.get<{ user: User }>('/api/auth/me');
                set((state) => {
                  state.user = response.user;
                  state.isAuthenticated = !!response.user;
                });
              } catch {
                set((state) => {
                  state.user = null;
                  state.isAuthenticated = false;
                });
              }
            },
            
            // Posts actions
            loadPosts: async (options = {}) => {
              set((state) => {
                state.postsLoading = true;
                state.postsError = null;
              });
              
              try {
                const params = new URLSearchParams();
                if (options.category) params.set('category', options.category);
                if (options.sort) params.set('sort', options.sort);
                if (options.page) params.set('page', String(options.page));
                
                const response = await apiHub.get<{ items: Post[]; total: number }>(
                  `/api/posts?${params.toString()}`,
                  {
                    cacheTTL: 30000,
                    retry: { maxAttempts: 2 },
                  }
                );
                
                set((state) => {
                  // Clear and repopulate posts map
                  state.posts.clear();
                  state.feedPosts = [];
                  
                  response.items.forEach((post) => {
                    state.posts.set(post.id, post);
                    state.feedPosts.push(post.id);
                  });
                  
                  state.postsLoading = false;
                });
              } catch (error) {
                set((state) => {
                  state.postsLoading = false;
                  state.postsError = (error as Error).message;
                });
              }
            },
            
            addPost: (post) => {
              set((state) => {
                state.posts.set(post.id, post);
                state.feedPosts.unshift(post.id);
              });
            },
            
            updatePost: (id, updates) => {
              set((state) => {
                const post = state.posts.get(id);
                if (post) {
                  state.posts.set(id, { ...post, ...updates });
                }
              });
            },
            
            deletePost: async (id) => {
              // Optimistic update
              const post = get().posts.get(id);
              set((state) => {
                state.posts.delete(id);
                state.feedPosts = state.feedPosts.filter(postId => postId !== id);
              });
              
              try {
                await apiHub.delete(`/api/posts/${id}`);
                apiHub.clearCache('/api/posts');
              } catch (error) {
                // Rollback on error
                if (post) {
                  set((state) => {
                    state.posts.set(id, post);
                    state.feedPosts.push(id);
                  });
                }
                throw error;
              }
            },
            
            likePost: async (id) => {
              const post = get().posts.get(id);
              if (!post) return;
              
              const wasLiked = post.likedByMe;
              const newScore = wasLiked ? post.score - 1 : post.score + 1;
              
              // Optimistic update
              set((state) => {
                const post = state.posts.get(id);
                if (post) {
                  post.likedByMe = !wasLiked;
                  post.score = newScore;
                }
              });
              
              try {
                await apiHub.post(`/api/posts/${id}/like`);
              } catch {
                // Rollback on error
                set((state) => {
                  const post = state.posts.get(id);
                  if (post) {
                    post.likedByMe = wasLiked;
                    post.score = wasLiked ? newScore + 1 : newScore - 1;
                  }
                });
              }
            },
            
            bookmarkPost: async (id) => {
              const post = get().posts.get(id);
              if (!post) return;
              
              const wasBookmarked = post.bookmarkedByMe;
              
              // Optimistic update
              set((state) => {
                const post = state.posts.get(id);
                if (post) {
                  post.bookmarkedByMe = !wasBookmarked;
                }
              });
              
              try {
                await apiHub.post('/api/user/bookmarks', { postId: id });
              } catch {
                // Rollback on error
                set((state) => {
                  const post = state.posts.get(id);
                  if (post) {
                    post.bookmarkedByMe = wasBookmarked;
                  }
                });
              }
            },
            
            // Categories actions
            loadCategories: async () => {
              set((state) => { state.categoriesLoading = true; });
              
              try {
                const response = await apiHub.get<{ categories: Category[] }>(
                  '/api/categories',
                  { cacheTTL: 300000 } // Cache for 5 minutes
                );
                
                set((state) => {
                  state.categories = response.categories;
                  state.categoriesLoading = false;
                });
              } catch {
                set((state) => { state.categoriesLoading = false; });
              }
            },
            
            // Notifications actions
            addNotification: (notification) => {
              const id = String(Date.now()) + Math.random().toString(36).substr(2, 9);
              const newNotification: Notification = {
                ...notification,
                id,
                timestamp: Date.now(),
                read: false,
              };
              
              set((state) => {
                state.notifications.unshift(newNotification);
                state.unreadCount++;
                
                // Keep only last 50 notifications
                if (state.notifications.length > 50) {
                  state.notifications = state.notifications.slice(0, 50);
                }
              });
              
              // Play sound if enabled
              if (get().settings.notifications.sound) {
                // Play notification sound
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(() => {});
              }
              
              // Show desktop notification if enabled
              if (get().settings.notifications.desktop && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification(notification.title, {
                    body: notification.message,
                    icon: '/icon-192x192.png',
                  });
                }
              }
            },
            
            markNotificationRead: (id) => {
              set((state) => {
                const notification = state.notifications.find(n => n.id === id);
                if (notification && !notification.read) {
                  notification.read = true;
                  state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
              });
            },
            
            clearNotifications: () => {
              set((state) => {
                state.notifications = [];
                state.unreadCount = 0;
              });
            },
            
            // UI actions
            toggleSidebar: () => {
              set((state) => {
                state.sidebarOpen = !state.sidebarOpen;
              });
            },
            
            openModal: (modalId) => {
              set((state) => {
                state.modalOpen = modalId;
              });
            },
            
            closeModal: () => {
              set((state) => {
                state.modalOpen = null;
              });
            },
            
            setFilter: (filter) => {
              set((state) => {
                state.activeFilters = { ...state.activeFilters, ...filter };
              });
              
              // Reload posts with new filters
              get().actions.loadPosts({
                category: filter.category,
                sort: filter.sort,
              });
            },
            
            // Settings actions
            updateSettings: (newSettings) => {
              set((state) => {
                state.settings = { ...state.settings, ...newSettings };
              });
              
              // Apply theme change
              if (newSettings.theme) {
                const theme = newSettings.theme === 'system' 
                  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : newSettings.theme;
                  
                document.documentElement.classList.toggle('dark', theme === 'dark');
              }
            },
            
            // Batch updates for performance
            batchUpdate: (updates) => {
              set((state) => {
                updates();
              });
            },
          },
        })
    )
  )
);

// Selectors for optimized re-renders
export const useUser = () => useGlobalStore((state) => state.user);
export const useIsAuthenticated = () => useGlobalStore((state) => state.isAuthenticated);
export const usePosts = () => useGlobalStore((state) => Array.from(state.posts.values()));
export const usePost = (id: string) => useGlobalStore((state) => state.posts.get(id));
export const useCategories = () => useGlobalStore((state) => state.categories);
export const useNotifications = () => useGlobalStore((state) => state.notifications);
export const useSettings = () => useGlobalStore((state) => state.settings);
export const useActions = () => useGlobalStore((state) => state.actions);

// Subscribe to SSE events - temporarily disabled to debug
// if (typeof window !== 'undefined') {
//   import('@/lib/apiHub').then(({ apiHub }) => {
//     // Subscribe to post events
//     apiHub.subscribeSSE('/api/sse?channels=posts', (event: any) => {
//       const { actions } = useGlobalStore.getState();
      
//       switch (event.type) {
//         case 'post:created':
//           actions.addPost(event.payload);
//           actions.addNotification({
//             type: 'info',
//             title: 'New post',
//             message: `${event.payload.authorName} created a new post`,
//           });
//           break;
          
//         case 'post:updated':
//           actions.updatePost(event.payload.id, event.payload);
//           break;
          
//         case 'post:deleted':
//           actions.batchUpdate(() => {
//             const state = useGlobalStore.getState();
//             state.posts.delete(event.payload.id);
//             state.feedPosts = state.feedPosts.filter(id => id !== event.payload.id);
//           });
//           break;
          
//         case 'post:liked':
//           actions.updatePost(event.payload.postId, {
//             score: event.payload.likes,
//           });
//           break;
//       }
//     });
//   });
// }
