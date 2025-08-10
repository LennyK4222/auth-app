"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

type Item = { id: string; name: string | null; email: string; avatar: string | null; createdAt: string; lastLoginAt: string | null; lastSeenAt?: string | null; online?: boolean };

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'acum';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} zile`;
}

function UserAvatar({ user, size = 7 }: { user: Item; size?: number }) {
  const [imageError, setImageError] = useState(false);
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const sizeInRem = `${size * 0.25}rem`;

  // Reset error state when user changes
  useEffect(() => {
    setImageError(false);
  }, [user.id, user.avatar]);

  if (!user.avatar || imageError) {
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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/user/recent?limit=8', { cache: 'no-store' });
        const data = (await res.json()) as { users: Item[] };
        if (!alive) return;
        const list = (data.users || [])
          .slice()
          .sort((a, b) => Number(!!b.online) - Number(!!a.online));
        setItems(list);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  // Refresh when heartbeat succeeds, and also poll every 30s as a fallback
  useEffect(() => {
    const onBeat = () => setRefreshKey(k => k + 1);
    window.addEventListener('heartbeat-ok', onBeat);
    const id = setInterval(onBeat, 30000);
    return () => {
      window.removeEventListener('heartbeat-ok', onBeat);
      clearInterval(id);
    };
  }, []);

  const onlineCount = useMemo(() => items.filter(i => i.online).length, [items]);
  const shown = useMemo(() => (onlyOnline ? items.filter(i => i.online) : items), [items, onlyOnline]);

  return (
    <aside className={`pointer-events-auto fixed bottom-4 right-4 z-20 w-[min(92vw,340px)] rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Utilizatori activi/noi <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{onlineCount} online</span></div>
        <button
          onClick={() => setOnlyOnline(v => !v)}
          className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${onlyOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          aria-pressed={onlyOnline}
        >
          {onlyOnline ? 'Afișează toți' : 'Doar activi'}
        </button>
      </div>
      {loading ? (
        <div className="text-sm text-slate-500">Se încarcă…</div>
      ) : shown.length === 0 ? (
        <div className="text-sm text-slate-500">Încă nimic de afișat.</div>
      ) : (
        <ul className="space-y-2">
          {shown.map((u: Item) => (
            <li key={u.id} className="flex items-center gap-2 rounded-xl bg-white/60 p-2 dark:bg-slate-900/60">
              <div className="relative">
                <UserAvatar user={u} size={7} />
                {u?.online ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"/>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-800 dark:text-slate-200">{u.name || u.email}</div>
                <div className="flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {u.online ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Online</span>
                  ) : (
                    <span>Văzut {timeAgo(u.lastSeenAt || u.lastLoginAt || u.createdAt)} în urmă</span>
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
