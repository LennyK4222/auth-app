import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken, type JWTPayload } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';

const VoteSchema = z.object({ dir: z.enum(['up','down','clear']) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let user: JWTPayload;
  try { user = await verifyAuthToken(token); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const json = await req.json();
  const { dir } = VoteSchema.parse(json);
  await connectToDatabase();
  const { id } = await params;
  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const votes = (post as { votes?: Record<string, number> }).votes || {};
  const prev = votes[user.sub] as (1|-1|undefined);
  if (dir === 'clear') {
    if (prev) {
      post.score -= prev;
      delete votes[user.sub];
    }
  } else if (dir === 'up') {
    if (prev === 1) {
      // no-op
    } else {
      if (prev === -1) post.score += 1; // remove downvote
      post.score += 1;
      votes[user.sub] = 1;
    }
  } else if (dir === 'down') {
    if (prev === -1) {
      // no-op
    } else {
      if (prev === 1) post.score -= 1; // remove upvote
      post.score -= 1;
      votes[user.sub] = -1;
    }
  }
  (post as any).votes = votes;
  await post.save();
  return NextResponse.json({ score: post.score });
}
