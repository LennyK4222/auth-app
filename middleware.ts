import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Utility: simple cookie parser (for edge)
function getCookie(req: NextRequest, name: string) {
  // NextRequest cookies API is available, prefer it
  try {
    return req.cookies.get(name)?.value || null;
  } catch {
    const raw = req.headers.get('cookie') || '';
    const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : null;
  }
}

function hexRandom64() {
  // Generate 32 random bytes => 64 hex chars using Web Crypto
  const arr = new Uint8Array(32);
  (crypto as unknown as Crypto).getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function middleware(request: NextRequest) {
  // Generate a per-request nonce for CSP and pass it to the app via request header
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Check both 'session' and 'token' cookies for compatibility
  let token = getCookie(request, 'session');
  if (!token) {
    token = getCookie(request, 'token');
  }
  const { pathname, host } = request.nextUrl;

  // Block direct access to uploads directory completely
  if (pathname.startsWith('/uploads/')) {
    console.log('Blocked direct access to uploads:', pathname);
    return new NextResponse('Forbidden - Use API endpoint', { status: 403 });
  }

  // If authenticated, keep users away from login/register
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = new URL('/', request.url);
    const res = NextResponse.redirect(url);
    // Attach security headers on redirect too
  addSecurityHeaders(res, nonce);
    return res;
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Issue CSRF token cookie (double-submit) if missing
  let csrf = getCookie(request, 'csrf');
  if (!csrf) {
    csrf = hexRandom64();
    const isLocalhost = host === 'localhost' || host?.startsWith('127.0.0.1');
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
    res.cookies.set('csrf', csrf, {
      httpOnly: false, // readable by client JS to send in header
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
  }

  // Add robust security headers to every response
  addSecurityHeaders(res, nonce);

  return res;
}

function addSecurityHeaders(res: NextResponse, nonce: string) {
  const csp = [
    "default-src 'self'",
    // Use a nonce for inline scripts we control; keep recaptcha sources
    `script-src 'self' 'strict-dynamic' 'nonce-${nonce}' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
    // Keep unsafe-inline for styles due to third-party libs and Tailwind preflight; can be hardened later with nonces/hashes
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
    "frame-src https://www.google.com/recaptcha/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
}

export const config = {
  // Run on all routes, including potential image requests
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
