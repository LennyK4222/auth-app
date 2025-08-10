import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';

export async function POST() {
  try {
    await connectToDatabase();

    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return NextResponse.json({ 
        message: `Database already contains ${existingCategories} categories. No seeding needed.` 
      });
    }

    const seedCategories = [
      {
        name: 'Tehnologie',
        slug: 'tehnologie',
        description: 'Discuții despre tehnologie, programare și inovație',
        color: 'from-blue-500 to-indigo-600',
        icon: 'Code',
        isActive: true,
        postCount: 2100
      },
      {
        name: 'Fotografie',
        slug: 'fotografie',
        description: 'Împărtășește și discută fotografiile tale',
        color: 'from-purple-500 to-pink-600',
        icon: 'Camera',
        isActive: true,
        postCount: 890
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Tot despre jocuri video și gaming',
        color: 'from-red-500 to-orange-600',
        icon: 'GamepadIcon',
        isActive: true,
        postCount: 3200
      },
      {
        name: 'Muzică',
        slug: 'muzica',
        description: 'Discută despre muzică și artiști favoriți',
        color: 'from-green-500 to-emerald-600',
        icon: 'Music',
        isActive: true,
        postCount: 1500
      },
      {
        name: 'Educație',
        slug: 'educatie',
        description: 'Resurse educaționale și învățare',
        color: 'from-yellow-500 to-amber-600',
        icon: 'BookOpen',
        isActive: true,
        postCount: 756
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Antreprenoriat și dezvoltare în afaceri',
        color: 'from-slate-500 to-slate-600',
        icon: 'Briefcase',
        isActive: true,
        postCount: 942
      }
    ];

    const insertedCategories = await Category.insertMany(seedCategories);

    return NextResponse.json({ 
      message: `Successfully seeded ${insertedCategories.length} categories`,
      categories: insertedCategories
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed categories' },
      { status: 500 }
    );
  }
}
