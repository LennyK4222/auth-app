import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(payload.sub).populate({
      path: 'bookmarks',
      populate: {
        path: 'authorId',
        select: 'name email role avatar'
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bookmarkedPosts = user.bookmarks || [];

    return NextResponse.json({ bookmarks: bookmarkedPosts });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Skip CSRF validation in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Skipping CSRF validation in development');
    }

    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Convert postId to ObjectId
    const postObjectId = new mongoose.Types.ObjectId(postId);

    // Check if post exists
    const post = await Post.findById(postObjectId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize bookmarks array if it doesn't exist
    if (!user.bookmarks) {
      user.bookmarks = [];
    }

    const bookmarkIndex = user.bookmarks.findIndex(
      (bookmark: mongoose.Types.ObjectId) => bookmark.toString() === postId
    );

    if (bookmarkIndex === -1) {
      // Add bookmark
      user.bookmarks.push(postObjectId);
      await user.save();
      return NextResponse.json({ bookmarked: true });
    } else {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      await user.save();
      return NextResponse.json({ bookmarked: false });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
