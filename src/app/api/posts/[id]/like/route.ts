import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, type JWTPayload } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { validateCsrf } from '@/lib/csrf';
import { awardXPForLike } from '@/lib/xp';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Temporary: Skip CSRF in development if no cookies are available
  const cookieToken = req.cookies.get('csrf')?.value;
  const headerToken = req.headers.get('x-csrf-token');
  const shouldSkipCsrf = process.env.NODE_ENV === 'development' && !cookieToken && !headerToken;
  
  if (!shouldSkipCsrf) {
    const csrfOk = await validateCsrf(req);
    if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  }
  
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let user: JWTPayload;
  try { user = await verifyAuthToken(token); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  await connectToDatabase();
  const { id } = await params;
  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const votes = (post as { votes?: Record<string, number> }).votes || {};
  const userKey = String(user.sub);
  const prev = votes[userKey];
  let liked: boolean;
  
  if (prev === 1) {
    // unlike
    delete votes[userKey];
    liked = false;
  } else {
    // like (clean any legacy values)
    votes[userKey] = 1;
    liked = true;
  }
  
  // recompute score from all votes
  const likes = Object.values(votes).filter(v => v === 1).length;
  post.score = likes;
  post.markModified('votes');
  await post.save();
  
  // Award XP to the post author when they receive a like (only when liking, not unliking)
  if (liked && (post as { authorId?: string }).authorId && String((post as { authorId?: string }).authorId) !== userKey) {
    try {
      const xpResult = await awardXPForLike(String((post as { authorId?: string }).authorId), 'post', id);
      if (xpResult?.levelUp) {
        console.log(`🎉 Post author ${(post as { authorId?: string }).authorId} leveled up to ${xpResult.newLevel}!`);
      }
    } catch (xpError) {
      console.error('Failed to award XP for like:', xpError);
    }
  }
  
  return NextResponse.json({ liked, likes });
}
