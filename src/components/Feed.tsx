"use client";
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { MessageSquare, TrendingUp, Clock, Trash2, Tag, Bookmark, Shield } from 'lucide-react';
import { useCsrfContext } from '@/contexts/CsrfContext';
import { ConfirmDialog } from '@/components/ui/dialog';
import Image from 'next/image';
import LikeButton from './LikeButton';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { ProfilePreviewTrigger } from '@/components/ProfilePreview';

interface FeedPost {
  id: string;
  _id: string;
  authorId: string;
  authorEmail: string;
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  title: string;
  body: string;
  score: number;
  votes: Record<string, 1 | -1>;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  canDelete?: boolean;
  category?: string;
}

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'acum';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
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

function getInitials(name?: string, email?: string) {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export default function Feed() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'hot'|'new'>('hot');
  const [category, setCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; postId: string | null; postTitle: string }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const { toast, ToastContainer } = useToast();
  const { csrfToken } = useCsrfContext();
  const { state } = useApp();
  const { isAuthenticated } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, page: page.toString(), pageSize: pageSize.toString() });
      if (category && category !== 'all') params.set('category', category);
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || 'Eroare la încărcarea postărilor');
      toast({
        title: "Eroare",
        description: error?.message || 'Nu pot încărca postările',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [sort, category, toast, page]);

  const deletePost = async (postId: string) => {
    if (!deleteDialog.postId || !csrfToken) return;
    
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Nu s-a putut șterge postarea');
      }

      // Remove post from local state
      setItems(prev => prev.filter(item => item.id !== postId));
      
      toast({
        title: "Succes!",
        description: "Postarea a fost ștearsă cu succes",
        variant: "success"
      });
      
      setDeleteDialog({ isOpen: false, postId: null, postTitle: '' });
    } catch (e: unknown) {
      const error = e as Error;
      toast({
        title: "Eroare",
        description: error?.message || 'Nu s-a putut șterge postarea',
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (postId: string, postTitle: string) => {
    console.log('🗑️ openDeleteDialog called with postId:', postId, 'title:', postTitle);
    setDeleteDialog({
      isOpen: true,
      postId,
      postTitle
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      postId: null,
      postTitle: ''
    });
  };

  const handleLike = (postId: string, liked: boolean, likes: number) => {
    setItems(prev => prev.map(item => item.id === postId ? { ...item, likedByMe: liked, score: likes } : item));
  };

  const handleBookmark = async (postId: string) => {
    console.log('🔖 handleBookmark called with postId:', postId);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('csrfToken:', csrfToken);
    
    if (!isAuthenticated) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a salva postări",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Sending bookmark request...');
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ postId }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        const { bookmarked } = data;
        
        setItems(prev => prev.map(item => 
          item.id === postId ? { ...item, bookmarkedByMe: bookmarked } : item
        ));
        
        toast({
          title: bookmarked ? "Salvat" : "Eliminat din salvate",
          description: bookmarked ? "Postarea a fost salvată" : "Postarea a fost eliminată din salvate",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        toast({
          title: "Eroare",
          description: `Nu s-a putut procesa salvarea: ${response.status}`,
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
  };

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // Elimin log-urile de debug
  }, [items]);

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header cyber */}
  <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.35)]">
              <TrendingUp className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-300 glitch" data-text="Forum">Forum</h2>
              <p className="text-sm text-slate-300">Discuții și idei</p>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-900/60 rounded-xl p-1 backdrop-blur border border-cyan-500/20">
            <button 
              onClick={() => setSort('hot')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all neon-button ${
                sort === 'hot' 
                  ? 'bg-cyan-600/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp size={16} />
              Hot
            </button>
            <button 
              onClick={() => setSort('new')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all neon-button ${
                sort === 'new' 
                  ? 'bg-fuchsia-600/20 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.25)]' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock size={16} />
              New
            </button>
          </div>
        </div>

        <div id="feed-composer">
          <Composer onPosted={load} />
        </div>

        {/* Category Filter - always visible */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setCategory('all')}
            className={`px-3 py-1.5 text-xs rounded-full border transition ${
              category === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Toate
          </button>
          {(state.categories || []).map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                category === cat.slug
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={cat.description || cat.name}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4 items-center justify-center p-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-semibold text-slate-200">Se încarcă postările...</span>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 text-red-400 bg-red-900/20 rounded-xl border border-red-500/30"
        >
          {error}
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-12 text-slate-300"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/80 flex items-center justify-center neon-ring">
            <MessageSquare className="w-8 h-8 text-cyan-300" />
          </div>
          <p className="text-lg font-medium mb-2">Încă nimic aici</p>
          <p className="text-sm">Fii primul care publică ceva!</p>
        </motion.div>
  ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((p, index) => (
              <motion.div
                key={p.id}
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
                  
                  console.log('✅ Navigating to thread:', p.id);
                  window.location.href = `/thread/${p.id}`;
                }}
              >
                <div className="p-6 flex gap-5">
                  <div data-no-nav onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                    <LikeButton 
                      postId={p.id} 
                      initialLikes={p.score} 
                      initialLiked={p.likedByMe || false} 
                      onLike={(liked, likes) => handleLike(p.id, liked, likes)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <ProfilePreviewTrigger userId={p.authorId}>
                        <div
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/profile/${p.authorId}`;
                          }}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="relative" data-admin-avatar={p.authorRole === 'admin' ? '1' : undefined}>
                            {p.authorAvatar ? (
                              <Image
                                src={p.authorAvatar}
                                alt={p.authorName || p.authorEmail}
                                width={40}
                                height={40}
                                className="relative z-10 w-10 h-10 rounded-full object-cover border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors shadow neon-ring"
                                unoptimized
                                suppressHydrationWarning
                              />
                            ) : (
                              <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-white text-lg font-bold group-hover:from-cyan-400 group-hover:to-fuchsia-500 transition-all shadow neon-ring">
                                {getInitials(p.authorName, p.authorEmail)}
                              </div>
                            )}
                            {/* Admin avatar effects handled globally via AdminAura (see data-admin-avatar) */}
                          </div>
                          <div>
                            <span className="font-semibold text-base text-cyan-200 group-hover:text-white">
                              {p.authorName || p.authorEmail}
                            </span>
                            {p.authorRole === 'admin' ? (
                              <span
                                data-admin-badge
                                className="relative ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold align-middle bg-red-500/20 text-red-200 ring-1 ring-red-500/50"
                              >
                                <Shield size={12} className="text-red-300" />
                                Admin
                              </span>
                            ) : (
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold align-middle ${p.authorRole === 'moderator' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'} w-fit`}>
                                {typeof p.authorRole === 'string' && p.authorRole.trim() ? (p.authorRole === 'user' ? 'Utilizator' : p.authorRole) : 'Utilizator'}
                              </span>
                            )}
                          </div>
                        </div>
                      </ProfilePreviewTrigger>
                    </div>
                    <h3 className="font-bold text-lg text-cyan-200 mb-2 transition-colors line-clamp-2">
                      <a href={`/thread/${p.id}`} className="hover:text-white glitch" data-text={p.title} onClick={e => e.stopPropagation()}>
                        {p.title}
                      </a>
                    </h3>
                    <p className="text-[15px] text-slate-300 mb-4 line-clamp-3">
                      {p.body}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} className="text-cyan-400" />
                        <span className="text-slate-300">{p.commentsCount} comentarii</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-fuchsia-400" />
                        <span className="text-slate-300" suppressHydrationWarning>{timeAgo(p.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag size={14} className="text-emerald-400" />
                        <span className="px-2 py-1 bg-slate-800/60 rounded-full text-xs font-medium text-slate-200">
                          {getCategoryDisplayName(p.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 ml-2" data-no-nav>
                        {p.canDelete && (
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
                                console.log('🗑️ Delete button clicked for post:', p.id);
                                e.preventDefault();
                                e.stopPropagation();
                                openDeleteDialog(p.id, p.title);
                              }}
                              data-no-nav
                              disabled={deletingId === p.id}
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
                              console.log('🔖 Bookmark button clicked for post:', p.id);
                              e.preventDefault();
                              e.stopPropagation();
                              handleBookmark(p.id);
                            }}
                            data-no-nav
                            aria-label={p.bookmarkedByMe ? 'Elimină din salvate' : 'Salvează postarea'}
                            className="w-9 h-9 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/30 z-10 relative"
                            title={p.bookmarkedByMe ? "Elimină din salvate" : "Salvează postarea"}
                          >
                            <Bookmark 
                              className={`w-5 h-5 ${
                                p.bookmarkedByMe 
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
        </motion.div>
      )}
      
      {/* Paginare sub feed */}
      {total > pageSize && (
        <nav className="flex justify-center items-center gap-2 mt-8 select-none overflow-x-auto max-w-full pb-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full border border-cyan-500/30 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-40"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Pagina anterioară"
          >
            <span className="sr-only">Pagina anterioară</span>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex gap-1 overflow-x-auto">
            {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pn => (
              <button
                key={pn}
                className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-semibold transition ${page === pn ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]' : 'bg-slate-900 text-slate-300 border-cyan-500/20 hover:bg-slate-800'}`}
                onClick={() => setPage(pn)}
                aria-current={page === pn ? 'page' : undefined}
              >
                {pn}
              </button>
            ))}
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full border border-cyan-500/30 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-40"
            onClick={() => setPage(page + 1)}
            disabled={page * pageSize >= total}
            aria-label="Următoarea pagină"
          >
            <span className="sr-only">Următoarea pagină</span>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </nav>
      )}
      
      {/* Dialog de confirmare pentru ștergere */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => deletePost(deleteDialog.postId!)}
        title="Șterge postarea"
        message={`Ești sigur că vrei să ștergi postarea "${deleteDialog.postTitle}"? Această acțiune nu poate fi anulată.`}
        confirmText="Șterge"
        cancelText="Anulează"
        isDestructive={true}
        isLoading={deletingId === deleteDialog.postId}
      />

      {/* Admin badge + Goku aura + Electric avatar animations */}
      <style jsx>{`
        @keyframes adminShimmer {
          0% { transform: translateX(-120%); opacity: 0.0; }
          10% { opacity: 0.9; }
          50% { opacity: 0.7; }
          100% { transform: translateX(120%); opacity: 0.0; }
        }
        .animate-admin-shimmer { animation: adminShimmer 2.6s linear infinite; }

        @keyframes kiPulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .animate-ki-pulse { animation: kiPulse 1.6s ease-in-out infinite; }

        @keyframes rotateAura { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-rotate-aura { animation: rotateAura 6s linear infinite; }

        @keyframes kiOrb {
          0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -14px) scale(1.15); opacity: 0; }
        }
        .animate-ki-orb { animation: kiOrb 1.8s ease-in-out infinite; }

        /* Electric avatar effects */
        @keyframes rotateFast { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .animate-rotate-fast { animation: rotateFast 3s linear infinite; }

        /* Orbit container rotates slowly to carry sparks around */
        @keyframes orbit { from { transform: rotate(0); } to { transform: rotate(-360deg); } }
        .animate-orbit { animation: orbit 4.5s linear infinite; }

        /* Spark flicker/scale for each dot */
        @keyframes spark { 
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
        .animate-spark { animation: spark 1.2s ease-in-out infinite; }

        /* Subtle overall flicker */
        @keyframes flicker { 
          0%, 100% { opacity: 0.85; }
          40% { opacity: 0.6; }
          60% { opacity: 1; }
        }
        .animate-flicker { animation: flicker 2.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { csrfToken } = useCsrfContext();
  
  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Câmpuri incomplete",
        description: "Te rog completează atât titlul cât și conținutul",
        variant: "destructive"
      });
      return;
    }
    
    setBusy(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });
      
      if (res.ok) {
        setTitle('');
        setBody('');
        onPosted();
        toast({
          title: "Succes!",
          description: "Postarea a fost publicată",
          variant: "success"
        });
      } else {
        throw new Error('Eroare la publicare');
      }
    } catch {
      toast({
        title: "Eroare",
        description: "Nu am putut publica postarea",
        variant: "destructive"
      });
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur p-4 dark:border-slate-700/60 dark:bg-slate-900/50"
    >
      <div className="space-y-3">
        <div>
          <input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Ce vrei să discuți?" 
            className="w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800/60 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30" 
          />
        </div>
        
        <div>
          <textarea 
            value={body} 
            onChange={e => setBody(e.target.value)} 
            placeholder="Detaliază ideea ta..." 
            className="w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800/60 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30" 
            rows={3} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Fii respectuos și constructiv
          </div>
          <motion.button 
            disabled={busy || !title.trim() || !body.trim()} 
            onClick={submit} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {busy ? (
              <>Se publică...</>
            ) : (
              <>
                <TrendingUp size={16} />
                Publică
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
