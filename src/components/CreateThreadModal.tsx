"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/useApp';

interface CreateThreadModalProps {
  categorySlug: string;
  categoryName: string;
}

export default function CreateThreadModal({ categorySlug, categoryName }: CreateThreadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { incrementCategoryCount, triggerRefresh } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Te rog completează titlul și conținutul');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch('/api/csrf');
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: content.trim(),
          category: categorySlug,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Thread creat cu succes!');
        setIsOpen(false);
        setTitle('');
        setContent('');
        
        // Update category count in real-time
        if (mounted) {
          incrementCategoryCount(categorySlug);
          triggerRefresh();
        }
        
        // Navigate to the new thread (API returns 'id', not 'postId')
        router.push(`/thread/${data.id}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Eroare la crearea thread-ului');
      }
    } catch {
      toast.error('Eroare de conexiune');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600/80 to-fuchsia-600/80 hover:from-cyan-500/90 hover:to-fuchsia-500/90 backdrop-blur-sm rounded-lg text-white font-medium transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-400/30"
      >
        <Plus className="w-4 h-4 mr-2" />
        Crează Thread Nou
      </button>
    );
  }

  // Modal content
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div 
        className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.3)] w-full max-w-2xl max-h-[90vh] overflow-hidden backdrop-blur-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30">
              <MessageSquare className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                Crează Thread Nou
              </h2>
              <p className="text-sm text-slate-300">
                în categoria <span className="font-medium text-cyan-300">{categoryName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800/80 rounded-lg transition-colors text-slate-400 hover:text-cyan-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-cyan-300 mb-2">
              Titlu Thread *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Introdu un titlu captivant pentru thread-ul tău..."
              className="w-full px-4 py-3 rounded-lg border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition backdrop-blur-sm"
              maxLength={200}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {title.length}/200 caractere
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-cyan-300 mb-2">
              Conținut *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descrie subiectul tău, pune întrebări sau împărtășește-ți părerea..."
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-slate-600/50 bg-slate-800/80 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none backdrop-blur-sm"
              maxLength={2000}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {content.length}/2000 caractere
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-cyan-500/30">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg font-medium transition-all flex items-center space-x-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Se creează...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Creează Thread</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render modal using portal to avoid stacking context issues
  return mounted && isOpen ? createPortal(modalContent, document.body) : null;
}
