import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, type JWTPayload } from '@/lib/auth/jwt';
import { terminateSession, terminateAllOtherSessions } from '@/lib/sessions';
import { validateCsrf } from '@/lib/csrf';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log('=== Session Termination API Called ===');
    
    const csrfOk = await validateCsrf(req);
    if (!csrfOk) {
      console.log('CSRF validation failed');
      return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    }
    console.log('CSRF validation passed');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let user: JWTPayload;
    try {
      user = await verifyAuthToken(token, true); // Require session validation
      console.log('Token verified for user:', user.sub);
    } catch {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { sessionId } = await params;
    
    // Dacă sessionId este "all", închide toate celelalte sesiuni
    if (sessionId === 'all') {
      const terminatedCount = await terminateAllOtherSessions(user.sub, token);
      return NextResponse.json({ 
        message: `${terminatedCount} sessions terminated`,
        terminatedCount 
      });
    }
    
    // Altfel, închide sesiunea specifică
    const success = await terminateSession(sessionId, user.sub);
    
    if (!success) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Session terminated' });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const ctype = req.headers.get('content-type') || '';
  
  // Doar pentru form submissions
  if (!(ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data'))) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  const form = await req.formData();
  const override = String(form.get('_method') || '').toUpperCase();
  
  if (override !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  // CSRF validation pentru form
  const cookieToken = req.cookies.get('csrf')?.value;
  const formToken = String(form.get('csrf') || '');
  
  if (!cookieToken || !formToken || cookieToken !== formToken) {
    return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  }
  
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
  
  if (sessionId === 'all') {
    const terminatedCount = await terminateAllOtherSessions(user.sub, token);
    return NextResponse.json({ 
      message: `${terminatedCount} sessions terminated`,
      terminatedCount 
    });
  }
  
  const success = await terminateSession(sessionId, user.sub);
  
  if (!success) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  return NextResponse.json({ message: 'Session terminated' });
}
