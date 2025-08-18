import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { userCache } from '@/lib/userCache';
import { subscribers } from '@/lib/userBus';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || 6), 24);
  
  // ⚡ ULTRA-FAST: Folosește cache-ul în loc de DB query
  const cachedUsers = await userCache.getActiveUsers();
  const list = cachedUsers.slice(0, limit).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    lastSeenAt: u.lastSeenAt,
    online: u.online
  }));

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  subscribers.add(writer);

  // Trimite lista inițială
  writer.write(new TextEncoder().encode(`data: ${JSON.stringify(list)}\n\n`));

  // Heartbeat la fiecare 15s ca să nu se închidă conexiunea
  const interval = setInterval(() => {
    writer.write(new TextEncoder().encode(`: ping\n\n`));
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(interval);
    try { writer.close(); } catch {}
    subscribers.delete(writer);
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Poți apela broadcast(list) din heartbeat sau dintr-un cron pentru update live
