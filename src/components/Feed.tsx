"use client";
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import { MessageSquare, TrendingUp, Clock, User, Trash2 } from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import LikeButton from './LikeButton';

interface FeedPost {
  id: string;
  _id: string;
  authorId: string;
  authorEmail: string;
  authorName?: string;
  title: string;
  body: string;
  score: number;
  votes: Record<string, 1 | -1>;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  canDelete?: boolean;
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

export default function Feed() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'hot'|'new'>('hot');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, ToastContainer } = useToast();
  const { csrfToken } = useCsrfToken();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?sort=${sort}`);
      const data = await res.json();
      setItems(data.items || []);
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
  }, [sort, toast]);

  const deletePost = async (postId: string) => {
    if (!csrfToken) return;
    
    // Ask for confirmation
    if (!confirm('Ești sigur că vrei să ștergi această postare? Această acțiune nu poate fi anulată.')) {
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Nu s-a putut șterge postarea');
      }

      // Remove post from local state
      setItems(prev => prev.filter(item => item.id !== postId));
      
      toast({
        title: "Success",
        description: "Postarea a fost ștearsă cu succes"
      });
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

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header modern */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-xl p-6 shadow-xl dark:from-slate-900/80 dark:to-slate-800/80 dark:border-slate-700/60"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                Forum
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Discuții și idei</p>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-1 backdrop-blur">
            <button 
              onClick={() => setSort('hot')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sort === 'hot' 
                  ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp size={16} />
              Hot
            </button>
            <button 
              onClick={() => setSort('new')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sort === 'new' 
                  ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' 
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Clock size={16} />
              New
            </button>
          </div>
        </div>

        <Composer onPosted={load} />
      </motion.div>

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-600 dark:text-slate-400">Se încarcă...</span>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 text-red-600 bg-red-50/50 rounded-xl dark:bg-red-950/20 dark:text-red-400"
        >
          {error}
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-12 text-slate-500 dark:text-slate-400"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-slate-400" />
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur hover:bg-white/90 hover:shadow-lg transition-all duration-200 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-slate-900/90"
              >
                <div className="p-4 flex gap-4">
                  <LikeButton postId={p.id} initialLikes={p.score} initialLiked={p.likedByMe || false} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        <a href={`/thread/${p.id}`} className="hover:underline">
                          {p.title}
                        </a>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/profile/${p.authorId}`;
                            }}
                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                          >
                            {p.authorName || p.authorEmail}
                          </span>
                        </div>
                        {p.canDelete && (
                          <motion.button
                            onClick={() => deletePost(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="Șterge postarea"
                          >
                            {deletingId === p.id ? (
                              <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                      {p.body}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{p.commentsCount} comentarii</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{timeAgo(p.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { csrfToken } = useCsrfToken();
  
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
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Se publică...
              </>
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
