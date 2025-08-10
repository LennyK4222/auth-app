import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Return only active categories for public use
    const categories = await Category.find({ isActive: true })
      .select('name slug description color icon postCount')
      .sort({ name: 1 });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
