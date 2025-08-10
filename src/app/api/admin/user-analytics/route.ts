import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { verifyAuthToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Verifică autentificarea admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyAuthToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculează datele statistice
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total utilizatori
    const totalUsers = await User.countDocuments();

    // Utilizatori activi azi
    const activeUsersToday = await User.countDocuments({
      lastSeenAt: { $gte: today }
    });

    // Utilizatori activi în ultimele 7 zile
    const activeUsersWeek = await User.countDocuments({
      lastSeenAt: { $gte: weekAgo }
    });

    // Utilizatori noi azi
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });

    // Utilizatori noi în ultimele 7 zile
    const newUsersWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Utilizatori noi în ultimele 30 zile
    const newUsersMonth = await User.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // Total postări și comentarii
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Media postărilor per utilizator
    const averagePostsPerUser = totalUsers > 0 ? totalPosts / totalUsers : 0;

    // Top utilizatori
    const topUsersData = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'author',
          as: 'comments'
        }
      },
      {
        $addFields: {
          postsCount: { $size: '$posts' },
          commentsCount: { $size: '$comments' }
        }
      },
      {
        $sort: { postsCount: -1, commentsCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          username: 1,
          email: 1,
          avatar: 1,
          postsCount: 1,
          commentsCount: 1,
          createdAt: 1,
          lastSeenAt: 1
        }
      }
    ]);

    const topUsers = topUsersData.map((userData: any) => ({
      _id: userData._id.toString(),
      username: userData.username || 'Unknown',
      email: userData.email || 'No email',
      avatar: userData.avatar,
      postsCount: userData.postsCount || 0,
      commentsCount: userData.commentsCount || 0,
      joinDate: userData.createdAt,
      lastActive: userData.lastSeenAt
    }));

    // Creșterea utilizatorilor în ultimele 7 zile
    const userGrowth: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const newUsers = await User.countDocuments({
        createdAt: {
          $gte: date,
          $lt: nextDate
        }
      });

      const activeUsers = await User.countDocuments({
        lastSeenAt: {
          $gte: date,
          $lt: nextDate
        }
      });

      userGrowth.push({
        date: date.toISOString(),
        newUsers,
        activeUsers
      });
    }

    const stats = {
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalPosts,
      totalComments,
      averagePostsPerUser,
      topUsers,
      userGrowth
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}
