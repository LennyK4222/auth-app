"use client";

import { useEffect, useState } from "react";
import ParticleNetwork from "@/components/ParticleNetwork";
import AdminAura from "@/components/AdminAura";
import { useLiveStream } from "@/hooks/useLiveStream";

const AURA_KEY = "ui:adminAura";

export default function ClientOnlyEffects() {
  const [mounted, setMounted] = useState(false);
  const [showAura, setShowAura] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(AURA_KEY);
      if (v !== null) setShowAura(v === "1");
    } catch {}
    const onAura = (e: Event) => {
      try {
        const enabled = (e as CustomEvent).detail?.enabled;
        if (typeof enabled === 'boolean') setShowAura(enabled);
      } catch {}
    };
    window.addEventListener("ui:adminAuraChange", onAura as EventListener);
    return () => {
      window.removeEventListener("ui:adminAuraChange", onAura as EventListener);
    };
  }, []);

  // Global SSE dispatcher: forward events as CustomEvent('app:event')
  useLiveStream('/api/events/stream', (evt) => {
    try {
      const detail = evt ?? {};
      window.dispatchEvent(new CustomEvent('app:event', { detail }));
    } catch {}
  }, []);

  if (!mounted) return null;
  return (
    <>
      <ParticleNetwork />
      {showAura && <AdminAura />}
    </>
  );
}
