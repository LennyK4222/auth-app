import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { createSession } from '@/lib/sessions';

// Endpoint pentru migrarea utilizatorilor existenți la sistemul de sesiuni
export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    
    // Verify token without session requirement
    let user;
    try {
      user = await verifyAuthToken(token, false);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Create session for existing user
    const userAgent = _req.headers.get('user-agent') || 'Unknown';
    const ip = _req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
              _req.headers.get('x-real-ip') || 
              'unknown';
    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days
    
    try {
      await createSession(user.sub, token, userAgent, ip, expiresAt);
      return NextResponse.json({ 
        message: 'Session created successfully',
        userId: user.sub 
      });
    } catch (error) {
      // Session might already exist
      console.log('Session creation failed (might already exist):', error);
      return NextResponse.json({ 
        message: 'Session already exists or created',
        userId: user.sub 
      });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
