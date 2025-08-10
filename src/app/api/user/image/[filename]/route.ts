import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, access } from 'fs/promises';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Await params to comply with Next.js 15
    const { filename } = await params;
    console.log('Image request for:', filename);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // Verify JWT token - check both 'session' and 'token' cookies
    let token = request.cookies.get('session')?.value;
    if (!token) {
      token = request.cookies.get('token')?.value;
    }
    
    if (!token) {
      console.log('No token provided in session or token cookies');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let payload: { sub: string; email: string; name?: string };
    try {
      console.log('Attempting to verify token:', token?.substring(0, 20) + '...');
      // Try without session validation first
      payload = await verifyAuthToken(token, false);
      console.log('Token verified for user:', payload.sub);
    } catch (error) {
      console.log('Invalid token:', error);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify user exists and is active
    const user = await User.findById(payload.sub);
    if (!user) {
      console.log('User not found:', payload.sub);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Basic filename validation
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension || !validExtensions.includes(extension)) {
      console.log('Invalid filename format:', filename);
      return new NextResponse('Bad Request', { status: 400 });
    }

    // For now, we'll allow access to images for authenticated users
    // In a more complex system, you could implement more granular permissions
    // based on the filename structure or user relationships

    // Construct file path (now in private directory)
    const filePath = join(process.cwd(), 'private', 'uploads', filename);
    console.log('Serving file:', filePath);

    // Check if file exists
    try {
      await access(filePath);
    } catch {
      console.log('File not found:', filePath);
      return new NextResponse('Not Found', { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension (already validated above)
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    console.log('Serving image with content type:', contentType);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
