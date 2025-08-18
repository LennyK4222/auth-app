"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useCsrfContext } from '@/contexts/CsrfContext';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  onLike?: (liked: boolean, likes: number) => void;
}

export default function LikeButton({ postId, initialLikes, initialLiked, onLike }: LikeButtonProps) {
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
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (res.status === 403 && retryCount < 2) {
        // Token might be expired, refresh and retry
        await refreshToken();
        setTimeout(() => handleLike(retryCount + 1), 1000);
        return;
      }

      if (!res.ok) {
        // Revert on error
        setLiked(prevLiked);
        setLikes(prevLikes);
        throw new Error('Failed to like post');
      }

      const data = await res.json();
      setLiked(data.liked);
      setLikes(data.likes);
      if (onLike) onLike(data.liked, data.likes);

      // Show animation for likes
      if (data.liked && !prevLiked) {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 600);
      }
    } catch (error) {
      // Already reverted above
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onClick = () => handleLike(0);

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={onClick}
        disabled={loading}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          liked 
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
            : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
        } disabled:opacity-50`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        <Heart 
          size={20} 
          className={`transition-all duration-200 ${liked ? 'fill-current' : ''}`}
        />
        
        {/* Animation hearts */}
        {showAnimation && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 text-red-500"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.8], y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Heart size={12} className="fill-current" />
            </motion.div>
            <motion.div
              className="absolute -top-1 -left-1 text-red-400"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 0.8, 0.6], y: -15 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Heart size={10} className="fill-current" />
            </motion.div>
            <motion.div
              className="absolute top-0 right-1 text-pink-500"
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 0.9, 0.7], y: -18 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Heart size={8} className="fill-current" />
            </motion.div>
          </>
        )}
      </motion.button>
      
      <motion.span 
        className="text-sm font-medium text-slate-600 dark:text-slate-400"
        key={likes}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.2 }}
      >
        {likes}
      </motion.span>
    </div>
  );
}
