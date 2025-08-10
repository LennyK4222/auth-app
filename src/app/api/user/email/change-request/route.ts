import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import crypto from 'crypto';
import { sendEmailDev } from '@/lib/email';
import { validateCsrf } from '@/lib/csrf';

const BodySchema = z.object({ newEmail: z.string().email() });

export async function POST(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token);

    const json = await req.json().catch(() => ({}));
    const { newEmail } = BodySchema.parse(json);

    await connectToDatabase();
    const existing = await User.findOne({ email: newEmail });
    if (existing) return NextResponse.json({ error: 'Email deja folosit' }, { status: 409 });

  const t = crypto.randomBytes(24).toString('hex');
    const exp = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  const tHash = crypto.createHash('sha256').update(t).digest('hex');

    const user = await User.findByIdAndUpdate(payload.sub, {
      pendingEmail: newEmail,
  emailChangeToken: tHash,
      emailChangeTokenExp: exp,
    }, { new: true }).select('email pendingEmail');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const url = new URL('/api/user/email/confirm', req.url);
    url.searchParams.set('token', t);

    await sendEmailDev(newEmail, 'Confirmă schimbarea emailului', `Click pentru confirmare: ${url.toString()}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error('email change request error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
