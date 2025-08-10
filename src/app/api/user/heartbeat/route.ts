import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { validateCsrf } from '@/lib/csrf';

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    console.log('💗 Heartbeat called');
    
    // Temporary: Skip CSRF in development if no cookies are available
    const cookieToken = req.cookies.get('csrf')?.value;
    const headerToken = req.headers.get('x-csrf-token');
    const shouldSkipCsrf = process.env.NODE_ENV === 'development' && !cookieToken && !headerToken;
    
    console.log('🔐 CSRF check:', { cookieToken: !!cookieToken, headerToken: !!headerToken, shouldSkip: shouldSkipCsrf });
    
    if (!shouldSkipCsrf) {
      const csrfOk = await validateCsrf(req);
      console.log('🛡️ CSRF validation result:', csrfOk);
      if (!csrfOk) {
        console.log('❌ CSRF validation failed');
        return NextResponse.json({ ok: false }, { status: 403 });
      }
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    console.log('🍪 Auth token found:', !!token);
    
    if (!token) {
      console.log('❌ No auth token');
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    
    try {
      const payload = await verifyAuthToken(token, true); // Require session validation
      console.log('✅ JWT validated for user:', payload.sub);
      
      await connectToDatabase();
      await User.updateOne({ _id: payload.sub }, { $set: { lastSeenAt: new Date() } });
      console.log('💗 Heartbeat updated for user:', payload.sub);
      
      return NextResponse.json({ ok: true });
    } catch (jwtError) {
      // Token is invalid, expired, or session was terminated
      console.log('❌ JWT validation failed:', jwtError);
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
