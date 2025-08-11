import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { signAuthToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    // Check if this is allowed only in development or if no admins exist
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user exists
    const user = await User.findOne({ email }) as {
      _id: { toString: () => string },
      email: string,
      name: string
    } | null;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role to admin
    await User.updateOne(
      { email },
      { $set: { role: 'admin' } }
    );

    // Generate new token with admin role
    const newToken = await signAuthToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: 'admin'
    });

  // Set the new token as cookie
    const response = NextResponse.json({ 
      message: `User ${email} has been promoted to admin`,
      user: {
        email: user.email,
        name: user.name,
        role: 'admin'
      }
    });

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV as string) === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
