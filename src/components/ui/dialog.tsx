"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
}

export function Dialog({ isOpen, onClose, children, title, maxWidth = "max-w-md" }: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className={`relative ${maxWidth} w-full mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </motion.button>
              </div>
            )}
            
            {/* Content */}
            <div className={title ? "p-6" : "p-6"}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmă",
  cancelText = "Anulează",
  isDestructive = false,
  isLoading = false
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <motion.button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {cancelText}
          </motion.button>
          
          <motion.button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </motion.button>
        </div>
      </div>
    </Dialog>
  );
}
