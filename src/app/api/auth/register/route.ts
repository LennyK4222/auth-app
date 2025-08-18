import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { validateCsrf } from '@/lib/csrf';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) {
    // Debug only: log details in development to diagnose CSRF mismatch
    if (process.env.NODE_ENV !== 'production') {
      try {
        const hdr = req.headers.get('x-csrf-token') || req.headers.get('X-CSRF-Token') || '';
        const cookieHeader = req.headers.get('cookie') || '';
        const m = cookieHeader.match(/(?:^|;\s*)csrf=([^;]+)/i);
        const cookieVal = m ? decodeURIComponent(m[1]) : '';
        // Avoid printing full secrets; show lengths and prefixes only
        console.warn('[CSRF DEBUG] Register POST invalid:', {
          headerLen: hdr.length, headerPrefix: hdr.slice(0, 8),
          cookieLen: cookieVal.length, cookiePrefix: cookieVal.slice(0, 8),
          headerMatchesCookie: hdr && cookieVal ? hdr === cookieVal : false,
        });
      } catch {}
    }
    return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  }
    const json = await req.json();
    const { email, password, name } = RegisterSchema.parse(json);

    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ email, passwordHash, name }) as typeof User.prototype;

    return NextResponse.json({ id: user._id.toString(), email: user.email, name: user.name });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
