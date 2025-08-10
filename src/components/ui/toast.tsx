"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const variants = {
    default: "bg-white/90 backdrop-blur border-slate-200 text-slate-900 dark:bg-slate-800/90 dark:border-slate-700 dark:text-white",
    destructive: "bg-red-50/90 backdrop-blur border-red-200 text-red-900 dark:bg-red-950/90 dark:border-red-800 dark:text-red-100",
    success: "bg-green-50/90 backdrop-blur border-green-200 text-green-900 dark:bg-green-950/90 dark:border-green-800 dark:text-green-100"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", duration: 0.4 }}
      className={`
        relative rounded-xl border p-4 shadow-lg min-w-[300px] max-w-md
        ${variants[variant]}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <div className="font-semibold text-sm">{title}</div>}
          {description && <div className="text-sm opacity-90 mt-1">{description}</div>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="opacity-50 hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = React.useCallback((props: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...props, id, onClose: removeToast }]);
  }, [removeToast]);

  const ToastContainer = React.useMemo(() => {
    return () => (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    );
  }, [toasts, removeToast]);

  return { toast, ToastContainer };
}
