import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';

function isValidObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(id)
      .select('name email avatar role bio company location website createdAt level')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [postsCount, commentsCount, likesGiven] = await Promise.all([
      Post.countDocuments({ authorId: id }),
      Comment.countDocuments({ authorId: id }),
      Post.countDocuments({ [`votes.${id}`]: { $exists: true } }),
    ]);

    const joinedDays = user.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      id: String(id),
      name: user.name || null,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || 'user',
      bio: user.bio || '',
      company: user.company || '',
      location: user.location || '',
      website: user.website || '',
      level: user.level || 1,
      stats: {
        posts: postsCount || 0,
        comments: commentsCount || 0,
        likesGiven: likesGiven || 0,
        joinedDays,
      },
    });
  } catch (err) {
    console.error('Error in public profile GET:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
