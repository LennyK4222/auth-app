"use client";
import { useEffect, useMemo, useRef, useState, type ComponentProps, type HTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trash2, Send, MessageSquare } from 'lucide-react';
import { useCsrfContext } from '@/contexts/CsrfContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import CommentLikeButton from '@/components/CommentLikeButton';
import { ProfilePreviewTrigger } from '@/components/ProfilePreview';
import Image from 'next/image';

type Comment = {
  id: string;
  body: string;
  authorEmail?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  createdAt?: string;
  likes?: number;
  likedByMe?: boolean;
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
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastRefresh = useRef(0);
  const { csrfToken, refreshToken } = useCsrfContext();

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
        } else if (data?.type === 'comment-liked' && data?.commentId) {
          // Lightweight in-place update for likes
          setComments(prev => prev.map(c => c.id === String(data.commentId)
            ? { ...c, likes: typeof data.likes === 'number' ? data.likes : (c.likes || 0) }
            : c
          ));
        }
      } catch {}
    };
    es.addEventListener("message", onMsg);
    return () => {
      es.removeEventListener("message", onMsg);
      es.close();
    };
  }, [postId]);

  const submitComment = async (text: string, retryCount = 0) => {
    try {
      setBusy(true);
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: text }),
      });
      
      if (res.status === 403 && retryCount < 2) {
        // Token might be expired, refresh and retry
        await refreshToken();
        // Small delay to ensure new token is ready
        setTimeout(() => submitComment(text, retryCount + 1), 1000);
        return;
      }
      
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    await submitComment(text);
  };

  function insertAtCursor(before: string, after: string = before, placeholder = '') {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const hasSelection = start !== end;
    const selected = body.slice(start, end) || placeholder;
    const newText = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newText);
    // restore caret position after state flush
    requestAnimationFrame(() => {
      const pos = start + before.length + (hasSelection ? selected.length : placeholder.length);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  const addBold = () => insertAtCursor('**', '**', 'text');
  const addItalic = () => insertAtCursor('*', '*', 'text');
  const addHeading = () => insertAtCursor('# ', '', 'Titlu');
  const addQuote = () => insertAtCursor('> ', '', 'citat');
  const addCode = () => insertAtCursor('`', '`', 'cod');
  const addCodeBlock = () => insertAtCursor('\n```\n', '\n```\n', 'cod');
  const addUl = () => insertAtCursor('- ', '', 'element listă');
  const addOl = () => insertAtCursor('1. ', '', 'element listă');
  const addLink = () => insertAtCursor('[', '](https://)', 'text');

  const onDelete = async (commentId: string, retryCount = 0) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers,
      });
      
      if (res.status === 403 && retryCount < 2) {
        // Token might be expired, refresh and retry
        await refreshToken();
        setTimeout(() => onDelete(commentId, retryCount + 1), 1000);
        return;
      }
      
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
      className="neon-card"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            <MessageSquare className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-cyan-300">
              Comentarii
            </h2>
            <p className="text-sm text-slate-300">
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
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button type="button" onClick={addBold} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-cyan-200 hover:bg-slate-800 transition">B</button>
            <button type="button" onClick={addItalic} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-fuchsia-500/30 text-fuchsia-200 hover:bg-slate-800 transition"><i>I</i></button>
            <button type="button" onClick={addHeading} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">H1</button>
            <button type="button" onClick={addQuote} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">„”</button>
            <button type="button" onClick={addCode} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">`code`</button>
            <button type="button" onClick={addCodeBlock} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">``` bloc</button>
            <button type="button" onClick={addUl} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">• listă</button>
            <button type="button" onClick={addOl} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">1. listă</button>
            <button type="button" onClick={addLink} className="px-2 py-1 text-xs rounded bg-slate-900/60 border border-cyan-500/30 text-slate-200 hover:bg-slate-800 transition">link</button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-slate-400">Preview</label>
              <button type="button" onClick={() => setShowPreview(v => !v)} className={`px-2 py-1 text-xs rounded border transition ${showPreview ? 'border-cyan-500/50 text-cyan-200 bg-cyan-600/20' : 'border-slate-700 text-slate-300 bg-slate-900/60 hover:bg-slate-800'}`}>{showPreview ? 'ON' : 'OFF'}</button>
            </div>
          </div>
          <div className="relative">
            <textarea
              name="body"
              placeholder="Participă la discuție..."
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 pr-12 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
              ref={textareaRef}
            />
            <motion.button
              type="submit"
              disabled={busy || !body.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </motion.button>
          </div>
          {showPreview && (
            <div className="mt-4 neon-card p-4">
              <div className="text-xs text-slate-400 mb-2">Previzualizare</div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    a: (props: ComponentProps<'a'>) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline" />
                    ),
                    code: (props: HTMLAttributes<HTMLElement> & { className?: string }) => {
                      const { className, children, ...rest } = props;
                      return (
                        <code className={`rounded bg-slate-800/80 px-1.5 py-0.5 ${className || ''}`} {...rest}>
                          {children}
                        </code>
                      );
                    },
                    pre: (props: HTMLAttributes<HTMLPreElement>) => (
                      <pre className="rounded-lg bg-slate-900/80 p-3 overflow-x-auto" {...props} />
                    )
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>
            </div>
          )}
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
                    className="group neon-card p-4 transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <ProfilePreviewTrigger userId={String(c.authorId || '')}>
                            <div className="flex items-center gap-2">
                              {c.authorAvatar ? (
                                <Image
                                  src={c.authorAvatar}
                                  alt={c.authorName || c.authorEmail || 'avatar'}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover neon-ring"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-white neon-ring">
                                  <User size={12} />
                                </div>
                              )}
                              <span className="text-sm font-medium text-cyan-200">
                                <span 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (c.authorId) window.location.href = `/profile/${c.authorId}`;
                                  }}
                                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                                >
                                  {c.authorName || c.authorEmail || "Unknown"}
                                </span>
                              </span>
                              {c.createdAt && (
                                <span className="text-xs text-slate-400" suppressHydrationWarning>
                                  • {timeAgo(c.createdAt)}
                                </span>
                              )}
                            </div>
                          </ProfilePreviewTrigger>
                        </div>
                        <div className="prose prose-invert max-w-none text-sm text-slate-300">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              a: (props: ComponentProps<'a'>) => (
                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline" />
                              ),
                              code: (props: HTMLAttributes<HTMLElement> & { className?: string }) => {
                                const { className, children, ...rest } = props;
                                return (
                                  <code className={`rounded bg-slate-800/80 px-1.5 py-0.5 ${className || ''}`} {...rest}>
                                    {children}
                                  </code>
                                );
                              },
                              pre: (props: HTMLAttributes<HTMLPreElement>) => (
                                <pre className="rounded-lg bg-slate-900/80 p-3 overflow-x-auto" {...props} />
                              ),
                              ul: (props: HTMLAttributes<HTMLUListElement>) => (
                                <ul className="list-disc pl-5" {...props} />
                              ),
                              ol: (props: HTMLAttributes<HTMLOListElement>) => (
                                <ol className="list-decimal pl-5" {...props} />
                              )
                            }}
                          >
                            {c.body}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CommentLikeButton
                          postId={postId}
                          commentId={c.id}
                          initialLikes={c.likes || 0}
                          initialLiked={!!c.likedByMe}
                          onLike={(liked, likes) => {
                            setComments(prev => prev.map(cc => cc.id === c.id ? { ...cc, likedByMe: liked, likes } : cc));
                          }}
                        />
                        {isOwner && (
                          <motion.button
                            onClick={() => onDelete(c.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </div>
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
