import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET() {
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

    // Fetch all users with their post and comment counts
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'authorId',
          as: 'userPosts'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'authorId',
          as: 'userComments'
        }
      },
      {
        $addFields: {
          postsCount: { $size: '$userPosts' },
          commentsCount: { $size: '$userComments' }
        }
      },
      {
        $project: {
          passwordHash: 0,
          userPosts: 0,
          userComments: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0,
          resetToken: 0,
          resetTokenExp: 0,
          emailChangeToken: 0,
          emailChangeTokenExp: 0,
          pendingEmail: 0
        }
      },
      {
        $addFields: {
          // Asigură că câmpurile boolean au valori default
          isActive: { $ifNull: ['$isActive', true] },
          isVerified: { $ifNull: ['$isVerified', false] },
          role: { $ifNull: ['$role', 'user'] }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new user (admin only)
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Verifică autentificarea admin
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyAuthToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { username, email, name, role = 'user' } = await request.json();

    // Verifică dacă utilizatorul există deja
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Creează utilizatorul nou
    const newUser = new User({
      username,
      email,
      name,
      role,
      password: 'temporary-password', // Admin trebuie să reseteze parola
      isActive: true,
      createdAt: new Date()
    });

    await newUser.save();

    return NextResponse.json(
      { message: 'User created successfully', userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
