import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { isAdmin } from '@/lib/auth/adminAuth';
import { validateCsrf } from '@/lib/csrf';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using
    const { id } = await params;
    
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
    const { name, description, color, icon, isActive } = body;

    if (!name || !color || !icon) {
      return NextResponse.json(
        { error: 'Name, color, and icon are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await connectToDatabase();

    // Check if another category with same name/slug exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }],
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        color,
        icon,
        isActive: isActive ?? true
      },
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Category updated successfully',
      category: updatedCategory 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before using
    const { id } = await params;
    
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

    await connectToDatabase();

    // Actually delete the category from database
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      category: deletedCategory 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
