"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export default function VoteBox({ postId, score: initial }: { postId: string; score: number }) {
  const [score, setScore] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<'up'|'down'|'clear'|null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { csrfToken } = useCsrfToken();
  
  const act = async (dir: 'up'|'down'|'clear') => {
    if (!csrfToken || loading) return; // Wait for CSRF token and prevent double clicks
    
    setLoading(true);
    setLastAction(dir);
    const prevScore = score;
    
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'X-CSRF-Token': csrfToken 
        }, 
        credentials: 'include', 
        body: JSON.stringify({ dir }) 
      });
      
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        
        // Show feedback animation
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1000);
      } else {
        // Revert on error
        setScore(prevScore);
      }
    } catch (error) {
      // Revert on error
      setScore(prevScore);
    } finally {
      setLoading(false);
      setLastAction(null);
    }
  };
  return (
    <div className="relative grid w-14 select-none place-items-center rounded-md border border-slate-200 bg-white/70 p-2 text-center text-sm dark:border-slate-800 dark:bg-slate-900/60">
      <motion.button 
        onClick={() => act('up')} 
        disabled={loading}
        className={`mb-1 rounded px-1 transition-colors duration-200 ${
          loading && lastAction === 'up' 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        } disabled:opacity-50`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Upvote"
      >
        ▲
      </motion.button>
      
      <motion.div 
        className="relative font-semibold text-slate-900 dark:text-white" 
        aria-live="polite"
        key={score}
        initial={{ scale: 1 }}
        animate={{ scale: showFeedback ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {score}
        
        <AnimatePresence>
          {showFeedback && lastAction === 'up' && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-green-500"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              +1
            </motion.div>
          )}
          {showFeedback && lastAction === 'down' && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              -1
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.button 
        onClick={() => act('down')} 
        disabled={loading}
        className={`mt-1 rounded px-1 transition-colors duration-200 ${
          loading && lastAction === 'down' 
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        } disabled:opacity-50`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Downvote"
      >
        ▼
      </motion.button>
      
      <motion.button 
        onClick={() => act('clear')} 
        disabled={loading}
        className="mt-1 text-[10px] text-slate-500 hover:underline disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        reset
      </motion.button>
    </div>
  );
}
