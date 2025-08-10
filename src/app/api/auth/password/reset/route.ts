import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validateCsrf } from '@/lib/csrf';

const BodySchema = z.object({ token: z.string().min(10), password: z.string().min(6) });

export async function POST(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
  const { token, password } = BodySchema.parse(body);

    await connectToDatabase();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ resetToken: tokenHash });
    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      // Avoid token probing details
      return NextResponse.json({ error: 'Token invalid sau expirat' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    user.passwordHash = hash;
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Date invalide' }, { status: 400 });
    }
    console.error('password reset error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
