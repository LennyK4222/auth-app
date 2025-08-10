import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, type JWTPayload } from '@/lib/auth/jwt';
import { getUserActiveSessions } from '@/lib/sessions';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let user: JWTPayload;
    try {
      user = await verifyAuthToken(token, true); // Require session validation
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const sessions = await getUserActiveSessions(user.sub);
    
    // Format sessions pentru UI
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      deviceInfo: session.deviceInfo,
      location: session.location,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: session.token === token
    }));
    
    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
