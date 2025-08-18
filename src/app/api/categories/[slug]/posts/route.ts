import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { Category } from '@/models/Category';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';

export const revalidate = 0;

interface CategoryLean {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  isActive: boolean;
}

interface PostLean {
  _id: string;
  title: string;
  body?: string;
  category: string;
  createdAt: Date;
  score?: number;
  votes?: Record<string, number>;
  authorId: {
    _id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    
    // Verify category exists
    const category = await Category.findOne({ slug, isActive: true }).lean() as unknown as CategoryLean;
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get sort parameter
    const url = new URL(req.url);
    const sort = url.searchParams.get('sort') || 'recent';
    
    // Build sort query
    let sortQuery = {};
    switch (sort) {
      case 'hot':
        sortQuery = { score: -1, createdAt: -1 };
        break;
      case 'top':
        sortQuery = { score: -1, createdAt: -1 };
        break;
      default: // recent
        sortQuery = { createdAt: -1 };
    }

    // Get user's bookmarks if authenticated
    let userBookmarks: string[] = [];
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const user = await verifyAuthToken(token);
        if (user) {
      const { User } = await import('@/models/User');
      const userDoc = await User.findById(user.sub).select('bookmarks').lean() as unknown as { bookmarks?: Array<{ toString(): string } | string> } | null;
      userBookmarks = (userDoc?.bookmarks || []).map((id) => typeof id === 'string' ? id : id.toString());
        }
      }
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
    }

    // Get posts from this category
    const posts = await Post.find({ category: slug })
      .sort(sortQuery)
      .limit(50)
      .populate('authorId', 'name email avatar role')
      .lean() as unknown as PostLean[];

    // Transform posts to match the expected format
    const transformedPosts = posts.map((post: PostLean) => {
      // Handle cases where authorId might be undefined or not populated
      let authorData = {
        _id: '',
        name: 'Anonim',
        email: '',
        avatar: undefined as string | undefined
      };

      if (post.authorId) {
        if (typeof post.authorId === 'object' && post.authorId._id) {
          // Populated authorId
          authorData = {
            _id: post.authorId._id.toString(),
            name: post.authorId.name || 'Anonim',
            email: post.authorId.email || '',
            avatar: post.authorId.avatar
          };
        } else if (typeof post.authorId === 'string') {
          // String authorId (not populated)
          authorData._id = post.authorId;
        }
      }

      return {
        _id: post._id.toString(),
        title: post.title,
        content: (post.body || '').substring(0, 150) + ((post.body || '').length > 150 ? '...' : ''),
        category: post.category,
        createdAt: post.createdAt.toISOString(),
        score: post.score || 0,
        votes: Object.keys(post.votes || {}).length,
        author: {
          ...authorData,
          role: (post.authorId as unknown as { role?: string })?.role || 'user'
        },
        bookmarkedByMe: userBookmarks.includes(post._id.toString()),
        commentsCount: 0 // You might want to populate this from comments collection
      };
    });

    return NextResponse.json({
      posts: transformedPosts,
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        postCount: category.postCount
      }
    });
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
