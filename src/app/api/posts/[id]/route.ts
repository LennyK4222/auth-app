import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { validateCsrf } from '@/lib/csrf';
import { cookies } from 'next/headers';

export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const post = await Post.findById(id).lean();
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const comments = await Comment.find({ postId: id }, { body: 1, authorEmail: 1, authorName: 1, authorId: 1, createdAt: 1 }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({
    id: String((post as any)._id),
    title: (post as any).title,
    body: (post as any).body,
    authorEmail: (post as any).authorEmail,
    authorName: (post as any).authorName || null,
    commentsCount: (post as any).commentsCount || 0,
    score: (post as any).score || 0,
    createdAt: (post as any).createdAt,
  comments: comments.map(c => ({ id: String((c as any)._id), body: (c as any).body, authorEmail: (c as any).authorEmail, authorName: (c as any).authorName || null, authorId: String((c as any).authorId), createdAt: (c as any).createdAt })),
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

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user owns the post or is admin
    const isOwner = post.authorId === payload.sub;
    const isAdmin = payload.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    // Delete all comments for this post
    await Comment.deleteMany({ postId: id });

    // Delete the post
    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
