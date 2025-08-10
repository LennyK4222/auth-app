import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const posts = await Post.find({})
      .select('title category createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      totalPosts: posts.length,
      posts: posts.map(post => ({
        id: post._id,
        title: post.title,
        category: post.category || 'No category',
        createdAt: post.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}
