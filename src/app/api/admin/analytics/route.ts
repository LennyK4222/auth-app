import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    totalUsers: 5,
    activeUsersToday: 2,
    activeUsersWeek: 4,
    newUsersToday: 1,
    newUsersWeek: 3,
    newUsersMonth: 5,
    totalPosts: 12,
    totalComments: 8,
    averagePostsPerUser: 2.4,
    topUsers: [
      {
        _id: "1",
        username: "testuser",
        email: "test@example.com",
        postsCount: 5,
        commentsCount: 3,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }
    ],
    userGrowth: [
      {
        date: new Date().toISOString(),
        newUsers: 1,
        activeUsers: 2
      }
    ]
  };

  return NextResponse.json(stats);
}
