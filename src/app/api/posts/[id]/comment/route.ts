import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { Post } from '@/models/Post';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { notifyCommentChange } from '@/lib/commentsBus';
import { awardXPForComment } from '@/lib/xp';

interface AuthUser {
  sub: string;
  email: string;
  name?: string;
}

interface RequestBody {
  body?: string;
}

const CommentSchema = z.object({ body: z.string().min(1).max(5000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // CSRF/body handling for both form and JSON submissions
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf')?.value;
  const ctype = req.headers.get('content-type') || '';
  
  // Temporary: Skip CSRF in development if no cookies are available
  const shouldSkipCsrf = process.env.NODE_ENV === 'development' && !cookieToken && !headerToken;
  
  let bodyText = '';
  if (ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data')) {
    const form = await req.formData();
    // If no header token, validate against form field token
    if (!headerToken) {
      const formToken = String(form.get('csrf') || '');
      if (!shouldSkipCsrf && (!cookieToken || !formToken || cookieToken.length !== formToken.length)) {
        return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
      }
      if (!shouldSkipCsrf) {
        let ok = 0;
        for (let i = 0; i < cookieToken!.length; i++) ok |= cookieToken!.charCodeAt(i) ^ formToken.charCodeAt(i);
        if (ok !== 0) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
      }
    } else {
      if (!shouldSkipCsrf) {
        const csrfOk = await validateCsrf(req);
        if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
      }
    }
    bodyText = String(form.get('body') || '');
  } else {
    // JSON submission path
    if (!shouldSkipCsrf) {
      const csrfOk = await validateCsrf(req);
      if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    }
    const json = await req.json().catch(() => ({} as RequestBody));
    bodyText = json?.body || '';
  }
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let user: AuthUser;
  try { 
    user = await verifyAuthToken(token) as AuthUser; 
  } catch { 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); 
  }
  // bodyText is already set above based on content-type
  const trimmed = (bodyText || '').trim();
  try {
    const { body } = CommentSchema.parse({ body: trimmed });
    bodyText = body;
  } catch (err) {
    return NextResponse.json({ error: 'Comentariul este gol sau prea scurt.' }, { status: 400 });
  }
  await connectToDatabase();
  const { id } = await params;
  const comment = await Comment.create({ postId: id, authorId: user.sub, authorEmail: user.email, authorName: user.name, body: bodyText });
  await Post.updateOne({ _id: id }, { $inc: { commentsCount: 1 } });
  
  // Award XP for creating a comment
  try {
    const xpResult = await awardXPForComment(user.sub, String(comment._id), id);
    if (xpResult?.levelUp) {
      console.log(`🎉 User ${user.sub} leveled up to ${xpResult.newLevel}!`);
    }
  } catch (xpError) {
    console.error('Failed to award XP for comment creation:', xpError);
  }
  
  // notify listeners
  try { notifyCommentChange(id); } catch {}

  // If the request was a form submission, redirect back to the thread page
  if (ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data')) {
  const redirectUrl = new URL(`/thread/${id}`, req.url);
    return NextResponse.redirect(redirectUrl, 303);
  }
  return NextResponse.json({ id: String(comment._id) }, { status: 201 });
}
