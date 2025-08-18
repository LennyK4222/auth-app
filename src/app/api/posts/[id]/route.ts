import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { User } from '@/models/User';
import { verifyAuthToken, type JWTPayload } from '@/lib/auth/jwt';
import { Types } from 'mongoose';

interface PostDoc {
  _id: string;
  title: string;
  body: string;
  authorEmail: string;
  authorName?: string;
  commentsCount: number;
  score: number;
  createdAt: Date;
}

interface CommentDoc {
  _id: string;
  body: string;
  authorEmail: string;
  authorName?: string;
  authorId: string;
  createdAt: Date;
}
import { validateCsrf } from '@/lib/csrf';
import { cookies } from 'next/headers';

export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  // Validate ObjectId to prevent CastError from malformed paths (e.g., source map requests)
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  // Determine current user (optional) to compute likedByMe
  let meSub: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const payload = await verifyAuthToken(token).catch(() => null) as JWTPayload | null;
      if (payload?.sub) meSub = String(payload.sub);
    }
  } catch {}
  const post = await Post.findById(id).lean() as unknown as PostDoc;
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const comments = await Comment.find(
    { postId: id }, 
    { body: 1, authorEmail: 1, authorName: 1, authorId: 1, createdAt: 1, likes: 1, likedBy: 1 }
  ).sort({ createdAt: 1 }).lean() as unknown as (CommentDoc & { likes?: number; likedBy?: Array<string | Types.ObjectId> })[];
  // Fetch avatars for unique authorIds
  const authorIds = Array.from(new Set(comments.map(c => String(c.authorId))));
  const avatarsMap = new Map<string, string | null>();
  if (authorIds.length) {
    const rawUsers = await User.find({ _id: { $in: authorIds } }, { avatar: 1 }).lean();
    const users = rawUsers as unknown as Array<{ _id: Types.ObjectId | string; avatar?: string | null }>; 
    for (const u of users) {
      avatarsMap.set(String(u._id), u.avatar || null);
    }
  }
  return NextResponse.json({
    id: String(post._id),
    title: post.title,
    body: post.body,
    authorEmail: post.authorEmail,
    authorName: post.authorName || null,
    commentsCount: post.commentsCount || 0,
    score: post.score || 0,
    createdAt: post.createdAt,
  comments: comments.map(c => ({ 
    id: String(c._id), 
    body: c.body, 
    authorEmail: c.authorEmail, 
    authorName: c.authorName || null, 
    authorId: String(c.authorId), 
    createdAt: c.createdAt,
    likes: typeof c.likes === 'number' ? c.likes : 0,
    likedByMe: meSub ? (Array.isArray(c.likedBy) && c.likedBy.some((u) => String(u) === meSub)) : false,
    authorAvatar: avatarsMap.get(String(c.authorId)) || null,
  })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate CSRF
    const isValidCsrf = await validateCsrf(req);
    if (!isValidCsrf) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user owns the post or is admin
    const isOwner = String(post.authorId) === String(payload.sub);
    const isAdmin = payload.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    // Store category for updating count later
    const postCategory = post.category;

    // Delete all comments for this post
    await Comment.deleteMany({ postId: id });

    // Delete the post
    await Post.findByIdAndDelete(id);

    // Update category post count if post had a category
    if (postCategory) {
      try {
        const { Category } = await import('@/models/Category');
        await Category.findOneAndUpdate(
          { slug: postCategory },
          { $inc: { postCount: -1 } }
        );
      } catch (categoryError) {
        console.error('Failed to update category post count after deletion:', categoryError);
        // Continue even if category update fails
      }
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
