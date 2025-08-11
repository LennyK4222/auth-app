import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { validateCsrf } from '@/lib/csrf';
import { updateSessionActivityDetailed } from '@/lib/sessions';
import { getClientIp, getUserAgent } from '@/lib/request';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // CSRF validation
    const cookieToken = req.cookies.get('csrf')?.value;
    const headerToken = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token');
    const shouldSkipCsrf = process.env.NODE_ENV === 'development' && !cookieToken && !headerToken;
    
    if (!shouldSkipCsrf) {
      const csrfOk = await validateCsrf(req);
      if (!csrfOk) return NextResponse.json({ ok: false }, { status: 403 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ ok: false }, { status: 401 });
    
    try {
  const payload = await verifyAuthToken(token, true);
      await connectToDatabase();
      await User.updateOne({ _id: payload.sub }, { $set: { lastSeenAt: new Date() } });
  // Update session fingerprint
  const userAgent = getUserAgent(req);
  const ip = getClientIp(req);
  try { await updateSessionActivityDetailed(token, userAgent, ip); } catch {}
      return NextResponse.json({ ok: true });
  } catch {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
