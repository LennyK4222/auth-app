import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCsrf } from '@/lib/csrf';
import { Session } from '@/models/Session';

export async function POST(request: NextRequest) {
  let csrfOk = await validateCsrf(request);
  if (!csrfOk) {
    // Fallback for HTML form posts: read token from form body
    try {
      const form = await request.formData();
      const formToken = form.get('csrf');
      const cookieStore = await cookies();
      const cookieToken = cookieStore.get('csrf')?.value;
      csrfOk = Boolean(formToken && cookieToken && String(formToken) === cookieToken);
    } catch {
      csrfOk = false;
    }
  }
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  
  // Invalidate session
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (token) {
    try {
      await Session.updateOne({ token }, { isActive: false });
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }
  
  const redirectUrl = new URL('/login', request.url);
  const { hostname } = new URL(request.url);
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
  const res = NextResponse.redirect(redirectUrl, 303);
  res.cookies.set('token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  });
  return res;
}
