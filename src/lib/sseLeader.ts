// Shared SSE with cross-tab leader election using BroadcastChannel
// API: const unsubscribe = subscribeSharedSSE(url, handler)
// Only one tab (leader) opens the EventSource; it rebroadcasts messages to others.

/* eslint-disable @typescript-eslint/no-explicit-any */

type Listener = (ev: MessageEvent) => void;

type Entry = {
  url: string;
  channel: BroadcastChannel;
  listeners: Set<Listener>;
  leaderId: string | null;
  isLeader: boolean;
  es: EventSource | null;
  lastHeartbeat: number;
  heartbeatTimer: number | null;
  electionTimer: number | null;
  closed: boolean;
};

const g = globalThis as unknown as { __sharedSSE?: Map<string, Entry> };
if (!g.__sharedSSE) g.__sharedSSE = new Map();
const shared = g.__sharedSSE;

const TAB_ID = (() => {
  try {
    return (crypto.getRandomValues(new Uint32Array(3)) as Uint32Array).join('-');
  } catch {
    return String(Math.random()).slice(2);
  }
})();

function channelName(url: string) {
  // BroadcastChannel name constraints are minimal, but keep it short and stable
  return `sse::${url}`;
}

function startLeader(entry: Entry) {
  if (entry.isLeader || entry.closed) return;
  entry.isLeader = true;
  entry.leaderId = TAB_ID;
  try {
    entry.es = new EventSource(entry.url);
    entry.es.onmessage = (ev: MessageEvent) => {
      // fan out locally
      for (const l of Array.from(entry.listeners)) {
        try { l(ev); } catch {}
      }
      // and to other tabs
      entry.channel.postMessage({ type: 'msg', data: (ev as any).data });
    };
    entry.es.onerror = () => {
      // keep ES open; browser will retry. followers will continue to use rebroadcasts
    };
  } catch {
    // Failed to open ES; step down so another tab can try
    entry.isLeader = false;
    entry.leaderId = null;
  }
  // Heartbeat to followers
  if (entry.heartbeatTimer) clearInterval(entry.heartbeatTimer);
  entry.heartbeatTimer = setInterval(() => {
    if (entry.closed) return;
    entry.channel.postMessage({ type: 'leader-alive', leaderId: TAB_ID, ts: Date.now() });
  }, 3000) as unknown as number;
  // Announce leadership immediately
  entry.channel.postMessage({ type: 'leader-announce', leaderId: TAB_ID, ts: Date.now() });
}

function stopLeader(entry: Entry) {
  if (!entry.isLeader) return;
  entry.isLeader = false;
  entry.leaderId = null;
  try { entry.es?.close(); } catch {}
  entry.es = null;
  if (entry.heartbeatTimer) clearInterval(entry.heartbeatTimer);
  entry.heartbeatTimer = null;
}

function scheduleElection(entry: Entry) {
  if (entry.closed || entry.isLeader) return;
  if (entry.electionTimer) return;
  entry.electionTimer = setTimeout(() => {
    entry.electionTimer = null;
    // If no heartbeat in last 5s, attempt to claim leadership
    if (Date.now() - entry.lastHeartbeat > 5000) {
      startLeader(entry);
    }
  }, 350) as unknown as number;
}

export function subscribeSharedSSE(url: string, onMessage: Listener): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    // Fallback to direct EventSource in non-browser or unsupported env
    const es = new EventSource(url);
    es.onmessage = onMessage as any;
    es.onerror = () => {};
    return () => { try { es.close(); } catch {} };
  }

  let entry = shared.get(url);
  if (!entry) {
    const channel = new BroadcastChannel(channelName(url));
    entry = {
      url,
      channel,
      listeners: new Set<Listener>(),
      leaderId: null,
      isLeader: false,
      es: null,
      lastHeartbeat: 0,
      heartbeatTimer: null,
      electionTimer: null,
      closed: false,
    };

    channel.onmessage = (evt: MessageEvent<any>) => {
      const msg = evt.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'msg') {
        const synthetic = { data: msg.data } as MessageEvent;
        for (const l of Array.from(entry!.listeners)) {
          try { l(synthetic); } catch {}
        }
      } else if (msg.type === 'leader-alive' || msg.type === 'leader-announce') {
        entry!.leaderId = msg.leaderId || entry!.leaderId;
        entry!.lastHeartbeat = Date.now();
        if (entry!.isLeader && msg.leaderId !== TAB_ID) {
          // Another tab claims leadership; step down
          stopLeader(entry!);
        }
      }
    };

    // If heartbeat is missing, try to elect a leader
    setInterval(() => {
      if (entry!.closed) return;
      if (!entry!.isLeader && Date.now() - entry!.lastHeartbeat > 7000) {
        scheduleElection(entry!);
      }
    }, 2000);

    // Kick off discovery
    scheduleElection(entry);
    shared.set(url, entry);
  }

  entry.listeners.add(onMessage);

  // In case there is no leader at the moment, schedule an election quickly
  scheduleElection(entry);

  // Unsubscribe cleanup
  return () => {
    const e = shared.get(url);
    if (!e) return;
    e.listeners.delete(onMessage);
    if (e.listeners.size === 0) {
      e.closed = true;
      stopLeader(e);
      try { e.channel.close(); } catch {}
      shared.delete(url);
    }
  };
}
