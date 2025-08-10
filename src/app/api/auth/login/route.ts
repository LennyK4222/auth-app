import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth/jwt';
import { rateLimit } from '@/lib/rateLimit';
import { validateCsrf } from '@/lib/csrf';
import { createSession } from '@/lib/sessions';
import { awardXPForDailyLogin } from '@/lib/xp';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  captcha: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
  // CSRF check
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const { exceeded } = rateLimit(`login:${ip}`);
    if (exceeded) {
      return NextResponse.json({ error: 'Prea multe încercări. Încearcă mai târziu.' }, { status: 429 });
    }

    const json = await req.json();
    const { email, password, captcha } = LoginSchema.parse(json);

    // Optional captcha verification
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const site = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (secret && site) {
      if (!captcha) {
        return NextResponse.json({ error: 'Captcha required' }, { status: 400 });
      }
      const params = new URLSearchParams({ secret, response: captcha });
      const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const ver = (await resp.json()) as { success: boolean };
      if (!ver.success) {
        return NextResponse.json({ error: 'Captcha invalid' }, { status: 400 });
      }
    }

    await connectToDatabase();

    const user = await User.findOne({ email }) as {
      _id: { toString: () => string },
      email: string,
      name: string,
      role: string,
      passwordHash: string
    } | null;
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

  // Update last login timestamp (non-blocking-ish)
  try { await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }); } catch {}
  
  // Award XP for daily login
  try {
    await awardXPForDailyLogin(user._id.toString());
  } catch (xpError) {
    console.error('Failed to award daily login XP:', xpError);
    // Continue with login even if XP awarding fails
  }
  
  const token = await signAuthToken({ 
    sub: user._id.toString(), 
    email: user.email, 
    name: user.name,
    role: user.role || 'user'
  });

  // Create session record
  const userAgent = req.headers.get('user-agent') || '';
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days
  try {
    await createSession(user._id.toString(), token, userAgent, ip, expiresAt);
  } catch (sessionError) {
    console.error('Failed to create session:', sessionError);
    // Continue with login even if session creation fails
  }

  const { hostname } = new URL(req.url);
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
  const domain = isLocalhost ? undefined : hostname;
    // Redirect to home so the browser follows with the new cookie
    const redirectUrl = new URL('/', req.url);
    const res = NextResponse.redirect(redirectUrl, 303);
    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      domain,
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
