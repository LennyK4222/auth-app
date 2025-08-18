"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title?: string;
  description?: string;
  message?: string; // legacy single-string payload
};

export default function ToasterClient() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Mark global toaster as available for other parts of the app (e.g., useToast hook)
    try {
      (window as any).__GLOBAL_TOASTER__ = true;
    } catch {}

    let idCounter = 1;
    const onShow = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { type?: ToastType; title?: string; description?: string; message?: string; duration?: number };
        const hasContent = !!(detail?.title || detail?.description || detail?.message);
        if (!hasContent) return;
        const t: Toast = { id: idCounter++, type: detail.type || "info", title: detail.title, description: detail.description, message: detail.message };
        setToasts(prev => [...prev, t]);
        const timeout = window.setTimeout(() => {
          setToasts(prev => prev.filter(x => x.id !== t.id));
        }, Math.max(1200, Math.min(8000, detail.duration ?? 2200)));
        return () => clearTimeout(timeout);
      } catch {}
    };
    window.addEventListener("toast:show", onShow as EventListener);
    return () => {
      window.removeEventListener("toast:show", onShow as EventListener);
      try { delete (window as any).__GLOBAL_TOASTER__; } catch {}
    };
  }, []);

  const base = "neon-card pointer-events-auto w-[min(92vw,22rem)] px-4 py-3 backdrop-blur-md transition-all animate-toastIn border-cyan-500/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]";
  const byType: Record<ToastType, string> = {
    success: "text-emerald-100",
    error: "text-red-100",
    info: "text-cyan-100",
  };

  const iconFor = (t: ToastType) => t === "success" ? <CheckCircle2 className="h-4 w-4" /> : t === "error" ? <XCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />;

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col items-end gap-3">
      {toasts.map(t => (
        <div key={t.id} className={`${base} ${byType[t.type]}`} role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-current opacity-90">
              {iconFor(t.type)}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <div className="font-semibold text-sm text-white/95">{t.title}</div>}
              {t.description && <div className="text-sm leading-5 text-slate-200/90 mt-0.5">{t.description}</div>}
              {!t.title && !t.description && t.message && (
                <div className="text-sm leading-5">{t.message}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
