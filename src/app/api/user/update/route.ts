import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyAuthToken, signAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { validateCsrf } from '@/lib/csrf';

const BodySchema = z.object({ name: z.string().trim().min(1).max(100).nullable().optional() });

export async function PATCH(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token);

    const json = await req.json().catch(() => ({}));
    const { name } = BodySchema.parse(json);

    await connectToDatabase();
  const update: Record<string, unknown> = {};
  if (name === null) update.$unset = { name: 1 }; // remove name
  else if (typeof name === 'string') update.name = name;

    const user = await User.findByIdAndUpdate(payload.sub, update, { new: true, runValidators: true }).select('email name');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Issue a fresh token so UI picks updated name
  const newToken = await signAuthToken({ sub: String(user._id), email: user.email as string, name: user.name || undefined });
    const { hostname } = new URL(req.url);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const secure = process.env.NODE_ENV === 'production' && !isLocalhost;
    const domain = isLocalhost ? undefined : hostname;
    const res = NextResponse.json({ email: user.email, name: user.name ?? null });
    res.cookies.set('token', newToken, {
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
    console.error('update profile error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
