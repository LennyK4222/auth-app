import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';
import { awardXPForPost } from '@/lib/xp';

interface PostDocument {
  _id: string;
  title: string;
  body: string;
  authorEmail: string;
  authorName?: string;
  authorId: string | { avatar?: string; name?: string; email?: string; _id: string };
  commentsCount?: number;
  score?: number;
  votes?: Record<string, number>;
  createdAt: Date;
  category?: string;
}

interface AuthUser {
  sub: string;
  email: string;
  name?: string;
}

type SortDirection = 1 | -1;

export const revalidate = 0;

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(20, Number(url.searchParams.get('pageSize') || 10));
  const sort = url.searchParams.get('sort') || 'hot'; // hot|new
  const rawCategory = url.searchParams.get('category') || undefined;
  // Basic slug validation: lowercase letters, numbers and dashes only
  const category = rawCategory && rawCategory !== 'all' && /^[a-z0-9-]{1,50}$/.test(rawCategory) ? rawCategory : undefined;
  const skip = (page - 1) * pageSize;
  const sortObj: Record<string, SortDirection> = sort === 'new' 
    ? { createdAt: -1 } 
    : { score: -1, createdAt: -1 };
  const filter = category ? { category } : {};
  const [items, total] = await Promise.all([
    Post.find(filter, { title: 1, body: 1, authorEmail: 1, authorName: 1, authorId: 1, commentsCount: 1, score: 1, createdAt: 1, votes: 1, category: 1 })
      .populate({ path: 'authorId', select: 'avatar name email role', strictPopulate: false })
      .sort(sortObj)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Post.countDocuments(filter),
  ]);
  let meSub: string | null = null;
  let userBookmarks: string[] = [];
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const { verifyAuthToken } = await import('@/lib/auth/jwt');
      const user = await verifyAuthToken(token) as AuthUser;
      meSub = String(user.sub);
      
      // Get user's bookmarks
      const { User } = await import('@/models/User');
      const userDoc = await User.findById(user.sub).select('bookmarks').lean();
      userBookmarks = userDoc?.bookmarks?.map((id: any) => String(id)) || [];
    }
  } catch {}

  const postsWithRoles = await Promise.all(items.map(async p => {
    const post = p as unknown as PostDocument;
    const authorIdStr = typeof post.authorId === 'object' ? String(post.authorId._id) : String(post.authorId);
    const meSubStr = String(meSub);
    const canDelete = meSubStr === authorIdStr;
    const authorData = typeof post.authorId === 'object' ? post.authorId as { avatar?: string; name?: string; email?: string; _id: string; role?: string } : null;
    let authorRole = authorData?.role || 'user';
    if (!authorData?.role && authorIdStr) {
      try {
        const { User } = await import('@/models/User');
        const user = await User.findById(authorIdStr).select('role').lean();
        authorRole = user?.role || 'user';
      } catch { authorRole = 'user'; }
    }
    return {
      id: String(post._id),
      title: post.title,
      body: post.body,
      authorEmail: post.authorEmail,
      authorName: post.authorName || authorData?.name || null,
      authorId: authorIdStr,
      authorAvatar: authorData?.avatar || null,
      authorRole,
      commentsCount: post.commentsCount || 0,
      score: post.score || 0,
      likedByMe: meSub ? Boolean(post.votes && post.votes[meSub] === 1) : false,
      bookmarkedByMe: meSub ? userBookmarks.includes(String(post._id)) : false,
      canDelete: canDelete, // User can delete their own posts
      createdAt: post.createdAt,
      category: post.category || 'general',
    };
  }));

  return NextResponse.json({ items: postsWithRoles, total, page, pageSize });
}

const PostSchema = z.object({
  title: z.string().min(1).max(140),
  body: z.string().min(1).max(5000),
  category: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // CSRF validation
  const cookieToken = req.cookies.get('csrf')?.value;
  const headerToken = req.headers.get('x-csrf-token');
  
  // Skip CSRF in development if no tokens are available
  const shouldSkipCsrf = process.env.NODE_ENV === 'development' && !cookieToken && !headerToken;
  
  if (!shouldSkipCsrf) {
    const csrfOk = await validateCsrf(req);
    if (!csrfOk) {
      return NextResponse.json({ error: 'CSRF invalid' }, { status: 403 });
    }
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
  const body = await req.json();
  const data = PostSchema.parse(body);
  await connectToDatabase();
  const post = await Post.create({
    authorId: user.sub,
    authorEmail: user.email,
    authorName: user.name,
    title: data.title,
    body: data.body,
    category: data.category,
  });

  // Update category post count if category is provided
  if (data.category) {
    try {
      const { Category } = await import('@/models/Category');
      await Category.findOneAndUpdate(
        { slug: data.category },
        { $inc: { postCount: 1 } }
      );
    } catch (categoryError) {
      console.error('Failed to update category post count:', categoryError);
      // Continue even if category update fails
    }
  }

  // Award XP for creating a post
  try {
    const xpResult = await awardXPForPost(user.sub, String(post._id));
    if (xpResult?.levelUp) {
      console.log(`🎉 User ${user.sub} leveled up to ${xpResult.newLevel}!`);
      // Poți adăuga aici notificări pentru level up
    }
  } catch (xpError) {
    console.error('Failed to award XP for post creation:', xpError);
    // Continue even if XP fails
  }

  return NextResponse.json({ id: String(post._id) }, { status: 201 });
}
