import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { signAuthToken } from '@/lib/auth/jwt';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token lipsă' }, { status: 400 });

    await connectToDatabase();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ emailChangeToken: tokenHash });
    if (!user) return NextResponse.json({ error: 'Token invalid' }, { status: 400 });

    if (!user.emailChangeTokenExp || user.emailChangeTokenExp < new Date()) {
      return NextResponse.json({ error: 'Token expirat' }, { status: 400 });
    }

    if (!user.pendingEmail) return NextResponse.json({ error: 'Nimic de confirmat' }, { status: 400 });

    user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailChangeToken = undefined;
  user.emailChangeTokenExp = undefined;
    await user.save();

    const newJwt = await signAuthToken({ sub: String(user._id), email: user.email, name: user.name || undefined });

    const res = NextResponse.redirect(new URL('/', req.url), { status: 303 });
    // cookie flags similar to login route
    const host = (await headers()).get('host') || 'localhost';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
    const domain = !isLocalhost ? host.split(':')[0] : undefined;

    res.cookies.set('token', newJwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      ...(domain ? { domain } : {}),
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error('email confirm error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
