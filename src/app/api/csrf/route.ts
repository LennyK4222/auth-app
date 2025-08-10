import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    // Generate CSRF token
    const csrfToken = randomBytes(32).toString('hex');
    
    const response = NextResponse.json({ csrfToken });
    
    // Set CSRF token as httpOnly cookie
    response.cookies.set('csrf', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
