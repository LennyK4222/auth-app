import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { validateCsrf } from '@/lib/csrf';

const BodySchema = z.object({
  currentPassword: z.string().min(1, "Parola curentă este obligatorie"), // Doar verificăm că nu e goală
  newPassword: z.string().min(6, "Parola nouă trebuie să aibă minim 6 caractere"),
});

export async function POST(req: NextRequest) {
  console.log('=== Change Password API Called ===');
  try {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) {
    console.log('CSRF validation failed');
    return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  }
  
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Verifying token...');
    const payload = await verifyAuthToken(token);
    console.log('Token verified for user:', payload.sub);

    const json = await req.json().catch(() => ({}));
    console.log('Request body:', { ...json, currentPassword: '[HIDDEN]', newPassword: '[HIDDEN]' });
    
    const { currentPassword, newPassword } = BodySchema.parse(json);
    console.log('Body schema validation passed');

    await connectToDatabase();
    console.log('Database connected');
    
    const user = await User.findById(payload.sub);
    if (!user) {
      console.log('User not found:', payload.sub);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('User found:', user.email);

    console.log('Attempting to verify current password for user:', payload.sub);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      console.log('Current password verification failed for user:', payload.sub);
      return NextResponse.json({ error: 'Parola curentă este greșită' }, { status: 400 });
    }

    console.log('Password verification successful, updating password for user:', payload.sub);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    console.log('Password updated successfully');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('=== Change Password API Error ===');
    console.error('Error type:', err?.constructor?.name);
    console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
    console.error('Full error:', err);
    
    if (err instanceof z.ZodError) {
      console.log('Zod validation error:', err.issues);
      return NextResponse.json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
