type SendFn = (payload: unknown) => void;

type Bus = {
  channels: Map<string, Set<SendFn>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __commentsBus: Bus | undefined;
}

function getBus(): Bus {
  if (!globalThis.__commentsBus) {
    globalThis.__commentsBus = { channels: new Map() };
  }
  return globalThis.__commentsBus;
}

export function addSubscriber(postId: string, send: SendFn) {
  const bus = getBus();
  let set = bus.channels.get(postId);
  if (!set) {
    set = new Set();
    bus.channels.set(postId, set);
  }
  set.add(send);
  return () => {
    set?.delete(send);
    if (set && set.size === 0) bus.channels.delete(postId);
  };
}

export function notifyCommentChange(postId: string) {
  const bus = getBus();
  const set = bus.channels.get(postId);
  if (!set || set.size === 0) return;
  const payload = { type: 'comments-changed', postId, ts: Date.now() };
  for (const fn of set) {
    try { fn(payload); } catch {}
  }
}
