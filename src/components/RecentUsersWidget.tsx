"use client";
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';

type Item = { id: string; name: string | null; email: string; avatar: string | null; createdAt: string; lastLoginAt: string | null; lastSeenAt?: string | null; online?: boolean };

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return 'acum';
    const m = Math.floor(diff / 60_000);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    return `${d} zile`;
  } catch {
    return 'recent';
  }
}

function UserAvatar({ user, size = 7 }: { user: Item; size?: number }) {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const sizeInRem = `${size * 0.25}rem`;

  // Reset error state when user changes
  useEffect(() => {
    setImageError(false);
    setMounted(true);
  }, [user.id, user.avatar]);

  if (!user.avatar || imageError || !mounted) {
    return (
      <div 
        className="relative grid place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-sky-500 text-[11px] font-semibold text-white"
        style={{ height: sizeInRem, width: sizeInRem }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image 
      src={user.avatar} 
      alt={user.name || user.email}
      className="rounded-md object-cover ring-1 ring-white/20"
      style={{ height: sizeInRem, width: sizeInRem }}
      onError={() => setImageError(true)}
      width={parseInt(sizeInRem)}
      height={parseInt(sizeInRem)}
    />
  );
}

export function RecentUsersWidget({ className = '' }: { className?: string }) {
  const [users, setUsers] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let active = true;
    setLoading(true);
    
    // Check if EventSource is available (client-side only)
    if (typeof EventSource === 'undefined') {
      setLoading(false);
      return;
    }
    
    try {
      es = new EventSource('/api/user/recent/stream');
      es.onmessage = (e) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          setUsers(Array.isArray(data) ? data : []);
          setLoading(false);
        } catch {}
      };
      es.onerror = () => {
        setLoading(false);
        es?.close();
      };
    } catch {
      setLoading(false);
    }
    return () => {
      active = false;
      es?.close();
    };
  }, []);

  const items = useMemo(() => {
    return onlyOnline ? users.filter(i => i.online) : users;
  }, [users, onlyOnline]);
  const onlineCount = useMemo(() => users.filter(i => i.online).length, [users]);

  return (
    <aside suppressHydrationWarning className={`pointer-events-auto rounded-xl border border-emerald-500/30 bg-slate-900/70 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.15)] ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-emerald-300 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Utilizatori activi/noi</span>
          <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300" suppressHydrationWarning>{onlineCount} online</span>
        </h3>
        <button
          onClick={() => setOnlyOnline(v => !v)}
          className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${onlyOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/80 border border-slate-600/50'}`}
          aria-pressed={onlyOnline}
        >
          {onlyOnline ? 'Afișează toți' : 'Doar activi'}
        </button>
      </div>
      {loading && items.length === 0 ? (
        <div className="text-sm text-emerald-300/80" suppressHydrationWarning>Se încarcă…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-emerald-300/80" suppressHydrationWarning>
          Încă nimic de afișat.
        </div>
      ) : (
        <ul className="space-y-3" suppressHydrationWarning>
          {items.map((u: Item) => (
            <li key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-800/80 rounded-lg transition-colors">
              <div className="relative">
                <UserAvatar user={u} size={7} />
                {u?.online ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"/>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-emerald-100">{u.name || u.email}</div>
                <div className="flex items-center gap-1 truncate text-xs text-emerald-300/80">
                  {u.online ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Online</span>
                  ) : (
                    <span suppressHydrationWarning>Văzut {timeAgo(u.lastSeenAt || u.lastLoginAt || u.createdAt)} în urmă</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
