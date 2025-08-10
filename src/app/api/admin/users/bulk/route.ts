import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();

    // Verifică autentificarea admin
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyAuthToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userIds, action } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Nu permite acțiuni pe propriul cont
    if (userIds.includes(decoded.userId)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk actions on your own account' },
        { status: 400 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        message = `${result.modifiedCount} users activated successfully`;
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        message = `${result.modifiedCount} users deactivated successfully`;
        break;

      case 'delete':
        // Șterge utilizatorii și toate postările/comentariile asociate
        await Promise.all([
          User.deleteMany({ _id: { $in: userIds } }),
          Post.deleteMany({ authorId: { $in: userIds } }),
          Comment.deleteMany({ authorId: { $in: userIds } })
        ]);
        message = `${userIds.length} users deleted successfully`;
        break;

      case 'make-moderator':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { role: 'moderator' }
        );
        message = `${result.modifiedCount} users promoted to moderator`;
        break;

      case 'remove-moderator':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { role: 'user' }
        );
        message = `${result.modifiedCount} users demoted to regular users`;
        break;

      case 'verify':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isVerified: true }
        );
        message = `${result.modifiedCount} users verified successfully`;
        break;

      case 'unverify':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isVerified: false }
        );
        message = `${result.modifiedCount} users unverified successfully`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
