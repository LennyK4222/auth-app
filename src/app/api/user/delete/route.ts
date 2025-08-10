import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { validateCsrf } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAuthToken(token);

    await connectToDatabase();
    await User.findByIdAndDelete(payload.sub);

    const res = NextResponse.redirect(new URL('/register', req.url), { status: 303 });

    const host = (await headers()).get('host') || 'localhost';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
    const domain = !isLocalhost ? host.split(':')[0] : undefined;

    // Clear token cookie
    res.cookies.set('token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      ...(domain ? { domain } : {}),
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error('delete account error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
