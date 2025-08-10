"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trash2, Send, MessageSquare } from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';

type Comment = {
  id: string;
  body: string;
  authorEmail?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
};

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

export default function CommentsSection({
  postId,
  initialComments,
  meSub,
}: {
  postId: string;
  initialComments: Comment[];
  meSub?: string;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const lastRefresh = useRef(0);
  const { csrfToken } = useCsrfToken();

  const headers: HeadersInit = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (csrfToken) h["X-CSRF-Token"] = csrfToken;
    return h;
  }, [csrfToken]);

  // SSE subscribe: on change, fetch latest comments
  useEffect(() => {
    const es = new EventSource(`/api/posts/${postId}/comments/stream`);
    const onMsg = async (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "comments-changed") {
          const now = Date.now();
          if (now - lastRefresh.current < 250) return; // debounce
          lastRefresh.current = now;
          const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json?.comments)) setComments(json.comments as Comment[]);
          }
        }
      } catch {}
    };
    es.addEventListener("message", onMsg as any);
    return () => {
      es.removeEventListener("message", onMsg as any);
      es.close();
    };
  }, [postId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: text }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        console.error('Comment submission failed:', res.status, errorData);
        // You could add a toast notification here if you have one
        return;
      }
      
      if (res.ok) {
        setBody("");
        // Pull fresh list
        const res2 = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
        if (res2.ok) {
          const json = await res2.json();
          if (Array.isArray(json?.comments)) setComments(json.comments as Comment[]);
        }
      }
    } catch (error) {
      console.error('Comment submission error:', error);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {}
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-xl shadow-xl dark:from-slate-900/80 dark:to-slate-800/80 dark:border-slate-700/60"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Comentarii
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {comments.length} {comments.length === 1 ? 'comentariu' : 'comentarii'}
            </p>
          </div>
        </div>

        {/* Comment Form */}
        <motion.form 
          onSubmit={onSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="relative">
            <textarea
              name="body"
              placeholder="Participă la discuție..."
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800/60 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
            />
            <motion.button
              type="submit"
              disabled={busy || !body.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Comments List */}
        {comments?.length ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {comments.map((c, index) => {
                const isOwner = meSub && c.authorId && String(c.authorId) === String(meSub);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-xl border border-slate-200/60 bg-white/60 p-4 transition-all hover:bg-white/80 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                            <User size={12} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/profile/${c.authorId}`;
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                            >
                              {c.authorName || c.authorEmail || "Unknown"}
                            </span>
                          </span>
                          {c.createdAt && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              • {timeAgo(c.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {c.body}
                        </p>
                      </div>
                      
                      {isOwner && (
                        <motion.button
                          onClick={() => onDelete(c.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-slate-500 dark:text-slate-400"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm">Încă nu sunt comentarii</p>
            <p className="text-xs mt-1">Fii primul care comentează!</p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
