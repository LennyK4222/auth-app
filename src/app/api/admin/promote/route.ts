import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

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
    const user = await User.findOne({ email });
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

    return NextResponse.json({ 
      message: `User ${email} has been promoted to admin`,
      user: {
        email: user.email,
        name: user.name,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
