import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { Comment } from '@/models/Comment';
import { Post } from '@/models/Post';
import { validateCsrf } from '@/lib/csrf';
import { notifyCommentChange } from '@/lib/commentsBus';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const csrfOk = await validateCsrf(req);
  if (!csrfOk) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let user: any;
  try { user = await verifyAuthToken(token); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  await connectToDatabase();
  const { id, commentId } = await params;
  const comment = await Comment.findById(commentId);
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String((comment as any).authorId) !== String(user.sub)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await Comment.deleteOne({ _id: commentId });
  await Post.updateOne({ _id: id }, { $inc: { commentsCount: -1 } });
  try { notifyCommentChange(id); } catch {}
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const ctype = req.headers.get('content-type') || '';
  // Only allow method override for form submissions
  if (!(ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data'))) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  const form = await req.formData();
  const override = String(form.get('_method') || '').toUpperCase();
  if (override !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // CSRF from form
  const cookieToken = req.cookies.get('csrf')?.value;
  const formToken = String(form.get('csrf') || '');
  if (!cookieToken || !formToken || cookieToken.length !== formToken.length) {
    return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
  }
  let ok = 0;
  for (let i = 0; i < cookieToken.length; i++) ok |= cookieToken.charCodeAt(i) ^ formToken.charCodeAt(i);
  if (ok !== 0) return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let user: any;
  try { user = await verifyAuthToken(token); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  await connectToDatabase();
  const comment = await Comment.findById(commentId);
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String((comment as any).authorId) !== String(user.sub)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await Comment.deleteOne({ _id: commentId });
  await Post.updateOne({ _id: id }, { $inc: { commentsCount: -1 } });
  try { notifyCommentChange(id); } catch {}

  // Redirect back to thread page
  const redirectUrl = new URL(`/thread/${id}`, req.url);
  return NextResponse.redirect(redirectUrl, 303);
}
