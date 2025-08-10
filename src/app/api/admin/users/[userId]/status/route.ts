import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();

    // Verifică autentificarea admin
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyAuthToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUser = await User.findById(decoded.sub);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = params;

    // Nu permite dezactivarea propriului cont
    if (userId === decoded.sub) {
      return NextResponse.json(
        { error: 'Cannot change your own account status' },
        { status: 400 }
      );
    }

    // Găsește utilizatorul și inversează statusul
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: !user.isActive },
      { new: true, select: '-password -resetPasswordToken -resetPasswordExpires' }
    );

    return NextResponse.json(
      { 
        message: `User ${updatedUser?.isActive ? 'activated' : 'deactivated'} successfully`, 
        user: updatedUser 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
