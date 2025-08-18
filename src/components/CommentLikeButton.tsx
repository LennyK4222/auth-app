"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useCsrfContext } from '@/contexts/CsrfContext';

interface CommentLikeButtonProps {
  postId: string;
  commentId: string;
  initialLikes: number;
  initialLiked: boolean;
  onLike?: (liked: boolean, likes: number) => void;
}

export default function CommentLikeButton({ postId, commentId, initialLikes, initialLiked, onLike }: CommentLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { csrfToken, refreshToken } = useCsrfContext();

  const handleLike = async (retryCount: number = 0) => {
    if (!csrfToken || loading) return;

    setLoading(true);
    const prevLiked = liked;
    const prevLikes = likes;

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const res = await fetch(`/api/posts/${postId}/comment/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (res.status === 403 && retryCount < 2) {
        await refreshToken();
        setTimeout(() => handleLike(retryCount + 1), 800);
        return;
      }

      if (!res.ok) {
        // Revert on error
        setLiked(prevLiked);
        setLikes(prevLikes);
        throw new Error('Failed to like comment');
      }

      const data = await res.json();
      setLiked(data.liked);
      setLikes(data.likes);
      onLike?.(data.liked, data.likes);

      if (data.liked && !prevLiked) {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 500);
      }
    } catch (err) {
      console.error('Comment like error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1" data-no-nav>
      <motion.button
        type="button"
        onClick={() => handleLike(0)}
        disabled={loading}
        className={`relative p-1.5 rounded-full transition-colors ${
          liked
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
        } disabled:opacity-50`}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.18 }}
      >
        <Heart size={16} className={liked ? 'fill-current' : ''} />
        {showAnimation && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 text-red-500"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.8], y: -14 }}
              transition={{ duration: 0.45 }}
            >
              <Heart size={10} className="fill-current" />
            </motion.div>
          </>
        )}
      </motion.button>
      <span className="text-xs text-slate-500 dark:text-slate-400 select-none min-w-[1.25rem] text-center">{likes}</span>
    </div>
  );
}
