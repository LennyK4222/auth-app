import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { validateCsrf } from '@/lib/csrf';
import { updateSessionActivityDetailed } from '@/lib/sessions';
import { getClientIp, getUserAgent } from '@/lib/request';
import { userCache } from '@/lib/userCache';
import { broadcast } from '@/lib/userBus';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // CSRF validation: skip in development for presence ping to avoid false 403s
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const csrfOk = await validateCsrf(req);
      if (!csrfOk) return NextResponse.json({ ok: false }, { status: 403 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ ok: false }, { status: 401 });
    
    try {
      const payload = await verifyAuthToken(token, true);
      await connectToDatabase();
      
      // ⚡ ULTRA-FAST: Folosește cache-ul în loc să interoghez DB-ul la fiecare heartbeat
      await userCache.updateUserActivity(payload.sub);
      
      // Update session fingerprint (async, non-blocking)
      const userAgent = getUserAgent(req);
      const ip = getClientIp(req);
      updateSessionActivityDetailed(token, userAgent, ip).catch(() => {}); // Fire and forget
      
      // ⚡ CACHED: Obține lista din cache (30s TTL)
      const cachedUsers = await userCache.getActiveUsers();
      
      // Broadcast doar dacă avem utilizatori în cache
      if (cachedUsers.length > 0) {
        const list = cachedUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          lastSeenAt: u.lastSeenAt,
          online: u.online
        }));
        broadcast(list);
      }
      
      return NextResponse.json({ ok: true });
  } catch {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
