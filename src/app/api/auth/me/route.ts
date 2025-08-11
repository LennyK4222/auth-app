import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

  // Require an active session; if session was terminated, treat as unauthenticated
  const payload = await verifyAuthToken(token, true);
  return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
