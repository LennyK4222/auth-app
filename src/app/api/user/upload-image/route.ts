import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Image Upload API Called ===');
    
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('No token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    console.log('Token verified for user:', payload.sub);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar' or 'cover'

    console.log('File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      uploadType: type
    });

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['avatar', 'cover'].includes(type)) {
      console.log('Invalid type:', type);
      return NextResponse.json({ error: 'Invalid type. Must be avatar or cover' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }

    // Create uploads directory outside of public (private storage)
    const uploadsDir = join(process.cwd(), 'private', 'uploads');
    console.log('Uploads directory:', uploadsDir);
    
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('Uploads directory ensured');
    } catch (error) {
      console.log('Directory creation error (might already exist):', error);
    }

    // Generate unique filename (simplified - no encryption for now)
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const fileName = `${payload.sub}-${type}-${uniqueId}.${fileExtension}`;
    
    const filePath = join(uploadsDir, fileName);
    
    console.log('Saving file:', { fileName, filePath });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    console.log('File saved successfully');

    // Create URL for the uploaded image (now pointing to our protected endpoint)
    const imageUrl = `/api/user/image/${fileName}`;
    console.log('Image URL:', imageUrl);

    // Update user with new image URL
    const updateField = type === 'avatar' ? 'avatar' : 'coverImage';
    const updatedUser = await User.findByIdAndUpdate(
      payload.sub,
      { [updateField]: imageUrl },
      { new: true }
    ).select('-passwordHash -resetToken -emailChangeToken');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      imageUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
