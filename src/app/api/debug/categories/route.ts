import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    
    const totalCount = await Category.countDocuments();
    const activeCount = await Category.countDocuments({ isActive: true });
    const categories = await Category.find().select('name slug isActive postCount').lean();
    
    return NextResponse.json({
      totalCount,
      activeCount,
      categories
    });
  } catch (error) {
    console.error('Error checking categories:', error);
    return NextResponse.json(
      { error: 'Failed to check categories', details: error },
      { status: 500 }
    );
  }
}
