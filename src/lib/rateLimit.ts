const LIMIT = 10; // allowed requests
const WINDOW_MS = 60_000; // 1 min
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const rec = store.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + WINDOW_MS;
  }
  rec.count += 1;
  store.set(key, rec);
  return { exceeded: rec.count > LIMIT, remaining: Math.max(0, LIMIT - rec.count), resetAt: rec.resetAt };
}
