import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { isAdmin } from '@/lib/auth/adminAuth';
import { validateCsrf } from '@/lib/csrf';

export async function GET() {
  try {
    await connectToDatabase();
    // For admin, return all categories (active and inactive)
    const categories = await Category.find({})
      .select('name slug description color icon postCount isActive')
      .sort({ name: 1 });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin permission
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !(await isAdmin(token))) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Validate CSRF
    const isValidCsrf = await validateCsrf(req);
    if (!isValidCsrf) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, color, icon } = body;

    if (!name || !color || !icon) {
      return NextResponse.json(
        { error: 'Name, color, and icon are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await connectToDatabase();

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = new Category({
      name,
      slug,
      description,
      color,
      icon,
      isActive: true,
      postCount: 0
    });

    await category.save();

    return NextResponse.json({ 
      message: 'Category created successfully',
      category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
