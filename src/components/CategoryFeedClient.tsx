"use client";

import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { MessageSquare, Calendar, User as UserIcon, Trash2, Bookmark, Tag, Clock } from 'lucide-react';
import { useCsrfContext } from '@/contexts/CsrfContext';
import { ConfirmDialog } from '@/components/ui/dialog';
import Image from 'next/image';
import HolographicDisplay from './HolographicDisplay';
import LikeButton from './LikeButton';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';

interface CategoryPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  score: number;
  votes: number;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  bookmarkedByMe?: boolean;
  commentsCount?: number;
}

interface CategoryFeedClientProps {
  initialPosts: CategoryPost[];
  categorySlug: string;
  initialSort?: string;
}

function getCategoryDisplayName(categorySlug?: string) {
  if (!categorySlug) return 'General';
  
  const categoryNames: Record<string, string> = {
    'tehnologie': 'Tehnologie',
    'fotografie': 'Fotografie',
    'gaming': 'Gaming',
    'muzica': 'Muzică',
    'educatie': 'Educație',
    'business': 'Business',
    'general': 'General',
  };
  
  return categoryNames[categorySlug] || categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
}

function TimeAgo({ iso }: { iso?: string | null }) {
  const [timeAgo, setTimeAgo] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!iso || !mounted) return;
    
    const updateTime = () => {
      const diff = Date.now() - new Date(iso).getTime();
      if (diff < 60_000) {
        setTimeAgo('acum');
      } else {
        const m = Math.floor(diff / 60_000);
        if (m < 60) {
          setTimeAgo(`${m}m`);
        } else {
          const h = Math.floor(m / 60);
          if (h < 24) {
            setTimeAgo(`${h}h`);
          } else {
            const d = Math.floor(h / 24);
            setTimeAgo(`${d}d`);
          }
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [iso, mounted]);

  if (!mounted) {
    return <span suppressHydrationWarning>...</span>;
  }

  return <span suppressHydrationWarning>{timeAgo}</span>;
}

function ClientImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center border border-cyan-400/30">
        <UserIcon className="w-3 h-3 text-white" />
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={alt}
      {...props}
      suppressHydrationWarning
    />
  );
}

export default function CategoryFeedClient({ initialPosts, categorySlug, initialSort = 'recent' }: CategoryFeedClientProps) {
  const [posts, setPosts] = useState<CategoryPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState(initialSort);
  const [mounted, setMounted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; postId: string | null; postTitle: string }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const { toast, ToastContainer } = useToast();
  const { csrfToken } = useCsrfContext();
  const { state } = useApp();
  const { user } = useAuth();

  // Ensure sort state is synchronized with initialSort prop
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setSort(initialSort);
    }
  }, [initialSort, mounted]);

  const loadPosts = useCallback(async (newSort: string) => {
    if (!mounted) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: newSort });
      const res = await fetch(`/api/categories/${categorySlug}/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca postările',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [categorySlug, toast, mounted]);

  // Load posts when component mounts or sort changes
  useEffect(() => {
    if (mounted) {
      loadPosts(sort);
    }
  }, [mounted, sort, loadPosts]);

  const handleSortChange = useCallback((newSort: string) => {
    if (mounted) {
      setSort(newSort);
      loadPosts(newSort);
    }
  }, [loadPosts, mounted]);

  const handleLike = useCallback((postId: string, liked: boolean, likes: number) => {
    if (mounted) {
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, score: likes }
          : post
      ));
    }
  }, [mounted]);

  const handleBookmark = useCallback(async (postId: string) => {
    console.log('🔖 handleBookmark called with postId:', postId);
    
    if (!user) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a salva postări",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const { bookmarked } = await response.json();
        if (mounted) {
          setPosts(prev => prev.map(post => 
            post._id === postId ? { ...post, bookmarkedByMe: bookmarked } : post
          ));
        }
        
        toast({
          title: bookmarked ? "Salvat" : "Eliminat din salvate",
          description: bookmarked ? "Postarea a fost salvată" : "Postarea a fost eliminată din salvate",
        });
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-a putut procesa salvarea",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la procesarea cererii",
        variant: "destructive",
      });
    }
  }, [user, csrfToken, toast, mounted]);

  const handleDelete = useCallback(async (postId: string) => {
    if (!csrfToken) {
      toast({
        title: 'Eroare',
        description: 'Token CSRF invalid',
        variant: 'destructive'
      });
      return;
    }

    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (res.ok) {
        if (mounted) {
          setPosts(prev => prev.filter(post => post._id !== postId));
        }
        toast({
          title: 'Succes',
          description: 'Postarea a fost ștearsă!',
          variant: 'success'
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge postarea',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  }, [csrfToken, toast, mounted]);

  const canDelete = (_authorId: string) => true;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-xl p-6 border border-slate-700/50 bg-slate-900/70">
              <div className="h-6 bg-slate-700 rounded mb-3"></div>
              <div className="h-4 bg-slate-800 rounded mb-2"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      {/* Sort options */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center bg-slate-900/60 rounded-xl p-1 backdrop-blur border border-cyan-500/20">
          <button
            onClick={() => handleSortChange('recent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === 'recent' 
                ? 'bg-cyan-600/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar size={16} />
            Recent
          </button>
          <button
            onClick={() => handleSortChange('hot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === 'hot' 
                ? 'bg-fuchsia-600/20 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.25)]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            Popular
          </button>
          <button
            onClick={() => handleSortChange('top')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sort === 'top' 
                ? 'bg-emerald-600/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            Top
          </button>
        </div>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ delay: index * 0.08 }}
              className="neon-card hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                const target = e.target as HTMLElement | null;
                console.log('🎯 Card click - target:', target?.tagName, target?.className);
                
                // Check if we clicked on a button or inside a button
                const clickedButton = target?.closest('button');
                const clickedNoNav = target?.closest('[data-no-nav]');
                const clickedLink = target?.closest('a');
                const clickedSvg = target?.closest('svg');
                
                console.log('🎯 Clicked button:', clickedButton);
                console.log('🎯 Clicked no-nav:', clickedNoNav);
                console.log('🎯 Clicked link:', clickedLink);
                console.log('🎯 Clicked svg:', clickedSvg);
                
                // Prevent navigation if we clicked on interactive elements
                if (clickedButton || clickedNoNav || clickedLink || clickedSvg) {
                  console.log('🚫 Navigation prevented - clicked on interactive element');
                  return;
                }
                
                console.log('✅ Navigating to thread:', post._id);
                window.location.href = `/thread/${post._id}`;
              }}
            >
              <div className="p-6 flex gap-5">
                <div data-no-nav onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                  <LikeButton 
                    postId={post._id} 
                    initialLikes={post.score} 
                    initialLiked={false} 
                    onLike={(liked, likes) => handleLike(post._id, liked, likes)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/profile/${post.author._id}`;
                      }}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {post.author.avatar ? (
                        <ClientImage 
                          src={post.author.avatar} 
                          alt={post.author.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors shadow neon-ring"
                          suppressHydrationWarning
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-white text-lg font-bold group-hover:from-cyan-400 group-hover:to-fuchsia-500 transition-all shadow neon-ring">
                          {(post.author.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-base text-cyan-200 group-hover:text-white">
                          {post.author.name}
                        </span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold align-middle ${
                          post.author.role === 'admin' ? 'bg-red-500/20 text-red-300' : 
                          post.author.role === 'moderator' ? 'bg-emerald-500/20 text-emerald-300' : 
                          'bg-cyan-500/20 text-cyan-300'
                        } w-fit`}>
                          {post.author.role && post.author.role.trim() ? 
                            (post.author.role === 'user' ? '👤 Utilizator' : `👤 ${post.author.role}`) : 
                            '👤 Utilizator'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-cyan-200 mb-2 transition-colors line-clamp-2">
                    <a href={`/thread/${post._id}`} className="hover:text-white glitch" data-text={post.title} onClick={e => e.stopPropagation()}>
                      {post.title}
                    </a>
                  </h3>
                  <p className="text-[15px] text-slate-300 mb-4 line-clamp-3">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} className="text-cyan-400" />
                      <span className="text-slate-300">{post.commentsCount || 0} comentarii</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-fuchsia-400" />
                      <span className="text-slate-300" suppressHydrationWarning>
                        <TimeAgo iso={post.createdAt} />
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag size={14} className="text-emerald-400" />
                      <span className="px-2 py-1 bg-slate-800/60 rounded-full text-xs font-medium text-slate-200">
                        {getCategoryDisplayName(post.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-2" data-no-nav>
                      {user && (user.role === 'admin' || user.id === post.author._id) && (
                        <div 
                          data-no-nav 
                          onClick={e => { 
                            e.stopPropagation(); 
                            e.preventDefault(); 
                          }}
                        >
                          <button
                            type="button"
                            onClick={e => {
                              console.log('🗑️ Delete button clicked for post:', post._id);
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteDialog({ isOpen: true, postId: post._id, postTitle: post.title });
                            }}
                            data-no-nav
                            disabled={deletingId === post._id}
                            className="w-9 h-9 p-0 inline-flex items-center justify-center rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 z-10 relative"
                            title="Șterge postarea"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      
                      <div 
                        data-no-nav 
                        onClick={e => { 
                          e.stopPropagation(); 
                          e.preventDefault(); 
                        }}
                      >
                        <button
                          type="button"
                          onClick={e => {
                            console.log('🔖 Bookmark button clicked for post:', post._id);
                            e.preventDefault();
                            e.stopPropagation();
                            handleBookmark(post._id);
                          }}
                          data-no-nav
                          aria-label={post.bookmarkedByMe ? 'Elimină din salvate' : 'Salvează postarea'}
                          className="w-9 h-9 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/30 z-10 relative"
                          title={post.bookmarkedByMe ? "Elimină din salvate" : "Salvează postarea"}
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${
                              post.bookmarkedByMe 
                                ? 'fill-yellow-500 text-yellow-500' 
                                : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, postId: null, postTitle: '' })}
        onConfirm={() => {
          if (deleteDialog.postId) {
            handleDelete(deleteDialog.postId);
            setDeleteDialog({ isOpen: false, postId: null, postTitle: '' });
          }
        }}
        title="Șterge postarea"
        message={`Ești sigur că vrei să ștergi postarea "${deleteDialog.postTitle}"? Această acțiune nu poate fi anulată.`}
        confirmText="Șterge"
        cancelText="Anulează"
        isDestructive={true}
      />
    </>
  );
}
