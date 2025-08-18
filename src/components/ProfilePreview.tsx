"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, MapPin, Link as LinkIcon, Award, CalendarDays } from "lucide-react";

type PublicProfile = {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  role?: string;
  bio?: string;
  level?: number;
  company?: string | null;
  location?: string | null;
  website?: string | null;
  stats?: { posts: number; comments: number; likesGiven?: number; joinedDays?: number };
};

interface TriggerProps {
  userId: string;
  children: React.ReactNode;
}

export function ProfilePreviewTrigger({ userId, children }: TriggerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const openTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const longPressActivated = useRef<boolean>(false);
  const [pressing, setPressing] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const GAP_ABOVE = 189; // px distance from trigger when above (raised)
  const GAP_BELOW = 10; // px distance from trigger when below
  const EST_WIDTH = 320; // approximate card width for clamping

  const fetchProfile = async () => {
    if (!userId) return;
    if (loading || profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/public/${userId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as PublicProfile;
      setProfile(data);
    } catch (e: unknown) {
      setError((e as Error).message || "Eroare la profil");
    } finally {
      setLoading(false);
    }
  };

  const openWithDelay = (delay = 180) => {
    if (!userId) return;
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      positionPopover();
      setOpen(true);
      fetchProfile();
    }, delay);
  };

  const closeNow = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(false);
  };
  const closeWithDelay = (delay = 180) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), delay);
  };

  const positionPopover = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Prefer above and center horizontally over the trigger; fallback below if not enough space
    const desiredX = rect.left + rect.width / 2 - EST_WIDTH / 2;
    const clampedX = Math.max(8, Math.min(desiredX, window.innerWidth - EST_WIDTH - 8));

    if (rect.top > 140) {
      setPlacement('above');
      const y = Math.max(8, rect.top - GAP_ABOVE); // translateY(-100%) will anchor above
      setPos({ x: clampedX, y });
    } else {
      setPlacement('below');
      const y = Math.min(rect.bottom + GAP_BELOW, window.innerHeight - 10);
      setPos({ x: clampedX, y });
    }
  };

  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onScroll = () => closeNow();
    const onResize = () => closeNow();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={`inline-flex items-center ${pressing ? 'outline outline-2 outline-cyan-500/60 rounded-full' : ''}`}
      onMouseEnter={() => {
        // Desktop: hover-dwell open after 1s
        if (openTimer.current) window.clearTimeout(openTimer.current);
        setPressing(true);
        openTimer.current = window.setTimeout(() => {
          positionPopover();
          setOpen(true);
          fetchProfile();
        }, 1000);
      }}
      onMouseLeave={() => {
        // Cancel pending dwell and close with a small delay
        if (openTimer.current) window.clearTimeout(openTimer.current);
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
        setPressing(false);
        closeWithDelay(150);
      }}
      onTouchStart={() => {
        console.debug('[ProfilePreview] touchstart');
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
        setPressing(true);
        longPressTimer.current = window.setTimeout(() => {
          console.debug('[ProfilePreview] touch long-press fired');
          positionPopover();
          setOpen(true);
          fetchProfile();
          longPressActivated.current = true;
        }, 600);
      }}
      onTouchEnd={() => {
        console.debug('[ProfilePreview] touchend');
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
        setPressing(false);
        // Do not close on touch end; keep popover open until mouse leaves/outside click
        // Keep flag true through the ensuing click event, then reset shortly after
        setTimeout(() => { longPressActivated.current = false; }, 250);
      }}
      onMouseDown={() => { /* No mouse long-press; use hover dwell only */ }}
      onContextMenu={(e) => {
        // Prevent context menu from interrupting long-press
        if (pressing || longPressActivated.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragStart={(e) => {
        // Prevent image/link drag from interrupting long-press
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={() => { /* No special handling */ }}
      onClick={() => { /* allow normal navigation/clicks */ }}
    >
      {children}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="fixed z-[1000]"
              style={{
                left: pos.x,
                top: pos.y,
                transform: placement === 'above' ? ('translateY(calc(-100% - 20px))' as any) : undefined
              }}
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current);
                setOpen(true);
              }}
              onMouseLeave={() => closeWithDelay(120)}
            >
              <a
                href={`/profile/${userId}`}
                className="block min-w-[280px] max-w-[340px] rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/95 to-slate-900/85 backdrop-blur-md shadow-xl p-4 text-slate-200 cursor-pointer hover:border-cyan-400/40 hover:shadow-cyan-500/10"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden neon-ring bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center">
                    {profile?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt={profile.name || profile.email} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">
                        {(profile?.name || profile?.email || "?")?.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-cyan-100 truncate max-w-[180px]">{profile?.name || profile?.email || 'Profil utilizator'}</div>
                      {typeof profile?.level === 'number' && (
                        <span title="Nivel" className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                          <Award size={12} /> Lv {profile.level}
                        </span>
                      )}
                    </div>
                    {profile?.role && (
                      <div className={`mt-1 inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${profile.role === 'admin' ? 'bg-red-500/15 text-red-300 border-red-500/30' : profile.role === 'moderator' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                        {profile.role}
                      </div>
                    )}
                  </div>
                </div>
                {/* Body */}
                <div className="mt-3 text-sm text-slate-300 space-y-2">
                  {error ? (
                    <div className="text-rose-300 text-xs">Eroare: {error}</div>
                  ) : loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 w-2/3 bg-slate-700/60 rounded" />
                      <div className="h-3 w-5/6 bg-slate-700/60 rounded" />
                      <div className="h-3 w-3/5 bg-slate-700/60 rounded" />
                    </div>
                  ) : (
                    <>
                      {profile?.bio && (
                        <p className="text-slate-300/90 line-clamp-3">{profile.bio}</p>
                      )}
                      <div className="space-y-1.5 text-xs text-slate-400">
                        {profile?.company && (
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-slate-500" />
                            <span className="truncate">{profile.company}</span>
                          </div>
                        )}
                        {profile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-500" />
                            <span className="truncate">{profile.location}</span>
                          </div>
                        )}
                        {profile?.website && (
                          <div className="flex items-center gap-2">
                            <LinkIcon size={14} className="text-slate-500" />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="truncate text-cyan-300 hover:underline">{profile.website}</a>
                          </div>
                        )}
                        {profile?.stats?.joinedDays != null && (
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-slate-500" />
                            <span>Membru de {profile.stats.joinedDays} zile</span>
                          </div>
                        )}
                      </div>
                      {profile?.stats && (
                        <div className="mt-1 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2 py-1.5 text-center">
                            <div className="text-cyan-300 font-semibold">{profile.stats.posts ?? 0}</div>
                            <div className="text-slate-400">Postări</div>
                          </div>
                          <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2 py-1.5 text-center">
                            <div className="text-cyan-300 font-semibold">{profile.stats.comments ?? 0}</div>
                            <div className="text-slate-400">Comentarii</div>
                          </div>
                          <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2 py-1.5 text-center">
                            <div className="text-cyan-300 font-semibold">{profile.stats.likesGiven ?? 0}</div>
                            <div className="text-slate-400">Like-uri</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Footer intentionally removed (no CTA) */}
              </a>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </span>
  );
}
