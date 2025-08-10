import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Post } from '@/models/Post';
import { Category } from '@/models/Category';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get default category (first active category)
    const defaultCategory = await Category.findOne({ isActive: true }).sort({ name: 1 });
    
    if (!defaultCategory) {
      return NextResponse.json({ error: 'No active categories found' }, { status: 400 });
    }

    // Update posts without category to use default category
    const result = await Post.updateMany(
      { category: { $exists: false } }, // Posts without category field
      { 
        $set: { category: defaultCategory.slug },
      }
    );

    // Also update posts with null or empty category
    const nullResult = await Post.updateMany(
      { $or: [{ category: null }, { category: '' }] },
      { 
        $set: { category: defaultCategory.slug },
      }
    );

    // Update category post count
    const totalPosts = await Post.countDocuments({ category: defaultCategory.slug });
    await Category.findByIdAndUpdate(defaultCategory._id, { postCount: totalPosts });

    return NextResponse.json({
      message: 'Posts migrated successfully',
      postsUpdated: result.modifiedCount + nullResult.modifiedCount,
      defaultCategory: defaultCategory.name,
      totalPostsInCategory: totalPosts
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
