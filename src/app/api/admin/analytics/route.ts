import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';

export async function GET() {
  try {
    await connectToDatabase();

    // Verifică autentificarea admin
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token, true);
    const currentUser = await User.findById(payload.sub);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculează datele statistice
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total utilizatori
    const totalUsers = await User.countDocuments();

    // Utilizatori activi azi (au avut activitate în ultimele 24h)
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

    // Top utilizatori cu postări
    const topUsersData = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'userPosts'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'author',
          as: 'userComments'
        }
      },
      {
        $addFields: {
          postsCount: { $size: '$userPosts' },
          commentsCount: { $size: '$userComments' }
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
          name: 1,
          email: 1,
          avatar: 1,
          postsCount: 1,
          commentsCount: 1,
          createdAt: 1,
          lastSeenAt: 1
        }
      }
    ]);

    const topUsers = topUsersData.map(user => ({
      _id: user._id.toString(),
      username: user.username || user.name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email || 'No email',
      avatar: user.avatar,
      postsCount: user.postsCount || 0,
      commentsCount: user.commentsCount || 0,
      joinDate: user.createdAt,
      lastActive: user.lastSeenAt
    }));

    // Creșterea utilizatorilor în ultimele 7 zile
    const userGrowth = [];
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
      averagePostsPerUser: Number(averagePostsPerUser.toFixed(1)),
      topUsers,
      userGrowth
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    
    // În caz de eroare, returnez date mock
    const mockStats = {
      totalUsers: 0,
      activeUsersToday: 0,
      activeUsersWeek: 0,
      newUsersToday: 0,
      newUsersWeek: 0,
      newUsersMonth: 0,
      totalPosts: 0,
      totalComments: 0,
      averagePostsPerUser: 0,
      topUsers: [],
      userGrowth: []
    };
    
    return NextResponse.json(mockStats);
  }
}
