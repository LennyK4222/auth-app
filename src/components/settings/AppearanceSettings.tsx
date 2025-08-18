"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";

const AURA_KEY = "ui:adminAura";

export function AppearanceSettings() {
  const [mounted, setMounted] = useState(false);
  // Start with a deterministic value for SSR to avoid hydration mismatch; hydrate from storage after mount
  const [showAura, setShowAura] = useState<boolean>(true);
  // inline notice removed in favor of global toaster for consistency
  const didInit = useRef(false);
  const externalUpdate = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // After mount, hydrate state from localStorage without firing side-effects
  useEffect(() => {
    if (!mounted) return;
    try {
      const v = localStorage.getItem(AURA_KEY);
      if (v !== null) {
        externalUpdate.current = true; // prevent side-effects in the change effect
        setShowAura(v === '1' || v === 'true');
      }
    } catch {}
  }, [mounted]);

  // Keep toggle in sync with external updates (same tab and other tabs)
  useEffect(() => {
    if (!mounted) return;
    const handleAuraChange = (e: Event) => {
      try {
        const enabled = (e as CustomEvent)?.detail?.enabled;
        if (typeof enabled === 'boolean') {
          externalUpdate.current = true;
          setShowAura(enabled);
        }
      } catch {}
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== AURA_KEY) return;
      const val = e.newValue;
      const enabled = val === '1' || val === 'true';
      externalUpdate.current = true;
      setShowAura(enabled);
    };
    window.addEventListener('ui:adminAuraChange', handleAuraChange as any);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('ui:adminAuraChange', handleAuraChange as any);
      window.removeEventListener('storage', handleStorage);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    // Skip the first run after hydration to avoid firing toast on initial load
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    try {
      // If the update came from outside, only reflect state locally (no side-effects)
      if (externalUpdate.current) {
        externalUpdate.current = false;
        return;
      }
      localStorage.setItem(AURA_KEY, showAura ? "1" : "0");
      // Broadcast to other components (same tab)
      window.dispatchEvent(new CustomEvent("ui:adminAuraChange", { detail: { enabled: showAura } } as any));
      // Global toast (top-right) with title + description like Feed
      window.dispatchEvent(new CustomEvent("toast:show", { detail: { 
        type: "success", 
        title: showAura ? "Succes!" : "Succes!",
        description: showAura ? "Efect Aura activat" : "Efect Aura dezactivat",
        duration: 2200 
      } } as any));
    } catch {}
  }, [mounted, showAura]);

  return (
    <section suppressHydrationWarning className={`rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 ${mounted ? '' : 'invisible'}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Apariție</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Controlează efectele vizuale globale</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Efect Neon Aura</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Activează/dezactivează overlay-ul vizual (AdminAura) pe pagini</p>
          </div>
          <motion.label whileTap={{ scale: 0.95 }} className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only"
              checked={showAura}
              onChange={(e) => setShowAura(e.target.checked)}
              aria-label="Comută efectul Neon Aura"
            />
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showAura ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAura ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
          </motion.label>
        </div>
      </div>
    </section>
  );
}
