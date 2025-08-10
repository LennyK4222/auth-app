import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';

export async function GET() {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -resetToken -emailChangeToken');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user statistics
    const [postsCount, commentsCount, totalLikesGiven] = await Promise.all([
      Post.countDocuments({ authorId: payload.sub }),
      Comment.countDocuments({ authorId: payload.sub }),
      Post.countDocuments({ [`votes.${payload.sub}`]: { $exists: true } })
    ]);

    // Calculate achievements based on user activity
    const achievements = [];
    if (postsCount >= 10) achievements.push('Author');
    if (totalLikesGiven >= 50) achievements.push('Social');
    if (commentsCount >= 100) achievements.push('Commentator');
    if ((user.level || 1) >= 5) achievements.push('Expert');

    return NextResponse.json({
      ...user.toObject(),
      achievements,
      stats: {
        posts: postsCount,
        likesGiven: totalLikesGiven || 0,
        comments: commentsCount,
        joinedDays: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    const body = await request.json();

    // Validate and sanitize input
    const allowedFields = [
      'name', 'bio', 'company', 'location', 'website', 'avatar', 'coverImage',
      'profileVisibility', 'showEmail', 'showOnlineStatus', 'allowMessages',
      'notifications', 'dataCollection'
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate specific fields
    if (updateData.website && typeof updateData.website === 'string' && !updateData.website.startsWith('http')) {
      updateData.website = 'https://' + updateData.website;
    }

    if (updateData.bio && typeof updateData.bio === 'string' && updateData.bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be under 500 characters' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.sub,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash -resetToken -emailChangeToken');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
