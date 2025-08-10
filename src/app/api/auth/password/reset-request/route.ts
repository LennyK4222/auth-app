import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import crypto from 'crypto';
import { sendEmailDev } from '@/lib/email';
import { validateCsrf } from '@/lib/csrf';

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { email } = BodySchema.parse(body);

    await connectToDatabase();
    const user = await User.findOne({ email });

    // Always respond OK to avoid user enumeration
    const genericOk = NextResponse.json({ ok: true });

    if (!user) return genericOk;

  const token = crypto.randomBytes(24).toString('hex');
    const exp = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  user.resetToken = tokenHash;
    user.resetTokenExp = exp;
    await user.save();

    const url = new URL('/reset', req.url);
  url.searchParams.set('token', token);

    await sendEmailDev(email, 'Resetare parolă', `Accesează linkul pentru a reseta parola: ${url.toString()}`);
    return genericOk;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Date invalide' }, { status: 400 });
    }
    console.error('reset-request error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
