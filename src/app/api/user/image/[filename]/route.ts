import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, access, stat } from 'fs/promises';
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

    // Reject any path separators just in case
    if (filename.includes('/') || filename.includes('\\')) {
      console.log('Invalid filename (path separators detected):', filename);
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Strict filename format: <24hex>-(avatar|cover)-<32hex>.<ext>
    const FILENAME_REGEX = /^[a-f0-9]{24}-(avatar|cover)-[a-f0-9]{32}\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const match = filename.match(FILENAME_REGEX);
  if (!match) {
      console.log('Invalid filename format:', filename);
      return new NextResponse('Bad Request', { status: 400 });
    }
  const fileKind = match[1]?.toLowerCase(); // 'avatar' | 'cover'
  const isAvatar = fileKind === 'avatar';
  const publicAvatars = process.env.IMAGE_PUBLIC_AVATARS !== 'false';

    // Decide if we can serve without auth (public avatars), otherwise enforce auth
    const allowBypass = (
      (process.env.NODE_ENV === 'development' && process.env.IMAGE_BYPASS_AUTH !== 'false') ||
      process.env.IMAGE_BYPASS_AUTH === 'true'
    );
    const skipAuth = isAvatar && publicAvatars;

    let payload: { sub: string; email: string; name?: string } | null = null;
    let requesterRole: 'user' | 'admin' | 'moderator' | undefined;

    if (!skipAuth) {
      // Verify JWT token - check both 'session' and 'token' cookies
      let token = request.cookies.get('session')?.value || request.cookies.get('token')?.value || null;
      // Also check Authorization header as fallback
      if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        console.log('No token provided in session/token cookies or authorization header');
        if (!allowBypass) {
          return new NextResponse('Unauthorized', { status: 401 });
        }
      }

      if (token) {
        try {
          console.log('Attempting to verify token:', token?.substring(0, 20) + '...');
          // Try without session validation first
          payload = await verifyAuthToken(token, false);
          console.log('Token verified for user:', payload.sub);
        } catch (error) {
          console.log('Invalid token:', error);
          if (process.env.NODE_ENV !== 'development' && !allowBypass) {
            return new NextResponse('Unauthorized', { status: 401 });
          }
        }
      }

      // Connect to database
      await connectToDatabase();

      // If we have a valid token, verify user exists and is active
      if (payload) {
        const user = await User.findById(payload.sub);
        if (!user) {
          console.log('User not found:', payload.sub);
          if (!allowBypass) {
            return new NextResponse('Unauthorized', { status: 401 });
          }
        } else {
          const role = user.role;
          requesterRole = role === 'admin' || role === 'moderator' ? role : 'user';
        }
      }

      // Enforce ownership when auth bypass is disabled: the 24-hex prefix must match requester or requester must be admin/moderator
      const userIdFromFilename = filename.split('-')[0]?.toLowerCase();
      if (!allowBypass && !isAvatar) {
        const isAdmin = requesterRole === 'admin' || requesterRole === 'moderator';
        const isOwner = payload?.sub?.toLowerCase() === userIdFromFilename;
        if (!isAdmin && !isOwner) {
          console.log('Forbidden: requester not allowed to access this file', { requester: payload?.sub, userIdFromFilename });
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    }

    // Extension is validated by regex above
  const extension = filename.split('.').pop()!.toLowerCase();

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

    // Stat for caching headers
    const fileStat = await stat(filePath);
    const lastModified = fileStat.mtime;
    const ifNoneMatch = request.headers.get('if-none-match') || request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('if-modified-since') || request.headers.get('If-Modified-Since');

    // Weak ETag based on mtime and size
    const etag = `W/"${fileStat.size}-${fileStat.mtimeMs.toString(16)}"`;

    // Conditional request handling
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }
    if (ifModifiedSince) {
      const since = new Date(ifModifiedSince);
      if (!isNaN(since.getTime()) && lastModified <= since) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } });
      }
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

  const maxAge = Math.max(0, Number(process.env.IMAGE_CACHE_SECONDS || 3600));
  return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
    'Cache-Control': `private, max-age=${maxAge}`,
        'X-Content-Type-Options': 'nosniff',
    'ETag': etag,
    'Last-Modified': lastModified.toUTCString(),
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
