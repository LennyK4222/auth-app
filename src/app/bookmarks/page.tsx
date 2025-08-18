import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { cookies } from 'next/headers';
import BookmarksClient from '../../components/BookmarksClient';
import CyberpunkBackground from '@/components/CyberpunkBackground';

export default async function BookmarksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const payload = await verifyAuthToken(token);
    if (!payload) {
      redirect('/login');
    }

    await connectToDatabase();

    const user = await User.findById(payload.sub).select('bookmarks').lean();
    if (!user) {
      redirect('/login');
    }

    const bookmarkIds = (user as unknown as { bookmarks?: Array<string | { toString(): string }> }).bookmarks || [];
    const posts = await Post.find({ _id: { $in: bookmarkIds } })
      .populate('authorId', 'name email role avatar')
      .lean();

    type LeanPost = { _id: unknown; title: string; body: string; authorId?: { _id?: unknown; name?: string; email?: string; role?: string; avatar?: string | null } | string; authorName?: string; authorEmail?: string; score?: number; votes?: Record<string, number>; commentsCount?: number; createdAt?: Date; category?: string };
    const bookmarkedPosts = (posts as unknown as LeanPost[]).map((p) => ({
      _id: String(p._id),
      title: p.title,
      body: p.body,
      authorId: {
        _id: typeof p.authorId === 'object' && p.authorId?._id ? String(p.authorId._id) : '',
        name: (typeof p.authorId === 'object' ? p.authorId?.name : undefined) || p.authorName || 'Anonim',
        email: (typeof p.authorId === 'object' ? p.authorId?.email : undefined) || p.authorEmail || '',
        role: (typeof p.authorId === 'object' ? p.authorId?.role : undefined) || 'user',
        avatar: (typeof p.authorId === 'object' ? p.authorId?.avatar : undefined) || undefined,
      },
      score: p.score || 0,
      votes: p.votes || {},
      commentsCount: p.commentsCount || 0,
      createdAt: (p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()),
      category: p.category || 'general',
      bookmarkedByMe: true,
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-950" suppressHydrationWarning>
        <CyberpunkBackground />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Postări Salvate
              </h1>
              <p className="text-gray-300">
                {bookmarkedPosts.length} postări salvate
              </p>
            </div>
            
            <BookmarksClient initialBookmarks={bookmarkedPosts} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    redirect('/login');
  }
}
