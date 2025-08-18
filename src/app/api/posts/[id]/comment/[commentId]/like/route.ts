import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { validateCsrf } from '@/lib/csrf';
import { notifyPostEvent } from '@/lib/commentsBus';
import { verifyAuthToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, commentId: string }> }) {
  try {
    // CSRF
    const csrfOk = await validateCsrf(req);
    if (!csrfOk) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

    // Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyAuthToken(token).catch(() => null) as { sub?: string } | null;
    if (!payload?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, commentId } = await params;
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await connectToDatabase();

    const userObjectId = new Types.ObjectId(payload.sub);
    const comment = await Comment.findOne({ _id: commentId, postId: id });
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const alreadyLiked = (comment.likedBy || []).some((u: Types.ObjectId) => String(u) === String(userObjectId));
    if (alreadyLiked) {
      // unlike
      comment.likedBy = (comment.likedBy || []).filter((u: Types.ObjectId) => String(u) !== String(userObjectId));
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      // like
      comment.likedBy = [...(comment.likedBy || []), userObjectId];
      comment.likes = (comment.likes || 0) + 1;
    }

    await comment.save();

    // Notify SSE subscribers (others will update counts; liker already has optimistic UI)
    try {
      notifyPostEvent(id, { type: 'comment-liked', commentId: String(comment._id), likes: comment.likes || 0 });
    } catch {}

    return NextResponse.json({ liked: !alreadyLiked, likes: comment.likes || 0 });
  } catch (err) {
    console.error('Comment like error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
