import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { PublicProfileView } from '@/components/profile/PublicProfileView';

interface Props {
  params: Promise<{ userId: string }>;
}

async function getPublicProfile(userId: string) {
  try {
    await connectToDatabase();
    
    const user = await User.findById(userId).select('-passwordHash -resetToken -emailChangeToken -pendingEmail -emailChangeToken -emailChangeTokenExp -resetTokenExp');
    
    if (!user) {
      return null;
    }

    // Check if profile is public or friends only
    if (user.profileVisibility === 'private') {
      return { user: null, isPrivate: true };
    }

    // Get user statistics
    const [postsCount, commentsCount, totalLikesGiven] = await Promise.all([
      Post.countDocuments({ authorId: userId }),
      Comment.countDocuments({ authorId: userId }),
      Post.countDocuments({ [`votes.${userId}`]: { $exists: true } })
    ]);

    // Calculate achievements
    const achievements = [];
    if (postsCount >= 10) achievements.push('Author');
    if (totalLikesGiven >= 50) achievements.push('Social'); // Schimbat din Popular în Social
    if (commentsCount >= 100) achievements.push('Commentator');
    if ((user.level || 1) >= 5) achievements.push('Expert');

    // Get recent posts if profile is public
    let recentPosts: any[] = [];
    let likedPosts: any[] = [];
    if (user.profileVisibility === 'public') {
      recentPosts = await Post.find({ authorId: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title content category createdAt votes')
        .lean();

      // Get posts that user has liked
      likedPosts = await Post.find({ [`votes.${userId}`]: { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('authorId', 'name email')
        .select('title content category createdAt votes authorId')
        .lean();
    }

    return {
      user: {
        _id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        bio: user.bio,
        company: user.company,
        location: user.location,
        website: user.website,
        avatar: user.avatar,
        coverImage: user.coverImage,
        level: user.level,
        experience: user.experience,
        badges: user.badges,
        profileVisibility: user.profileVisibility,
        showEmail: user.showEmail,
        showOnlineStatus: user.showOnlineStatus,
        allowMessages: user.allowMessages,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : undefined,
        achievements,
        stats: {
          posts: postsCount,
          likesGiven: totalLikesGiven || 0,
          comments: commentsCount,
          joinedDays: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        }
      },
      recentPosts: recentPosts.map(post => ({
        _id: (post._id as any).toString(),
        title: post.title,
        content: post.content,
        category: post.category,
        createdAt: (post.createdAt as any).toISOString(),
        likes: post.votes || {}
      })),
      likedPosts: likedPosts.map(post => ({
        _id: (post._id as any).toString(),
        title: post.title,
        content: post.content,
        category: post.category,
        createdAt: (post.createdAt as any).toISOString(),
        likes: post.votes || {},
        authorName: (post.authorId as any)?.name,
        authorEmail: (post.authorId as any)?.email,
        authorId: (post.authorId as any)?._id ? ((post.authorId as any)._id as any).toString() : null
      })),
      isPrivate: false
    };

  } catch (error) {
    console.error('Error fetching public profile:', error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  
  if (!userId || userId.length !== 24) {
    notFound();
  }

  const profileData = await getPublicProfile(userId);
  
  if (!profileData) {
    notFound();
  }

  if (profileData.isPrivate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profil Privat</h1>
          <p className="text-slate-600 dark:text-slate-300">Acest utilizator și-a setat profilul ca privat.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <PublicProfileView 
        profile={profileData.user!} 
        recentPosts={profileData.recentPosts || []}
        likedPosts={profileData.likedPosts || []}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const profileData = await getPublicProfile(userId);
  
  if (!profileData?.user) {
    return {
      title: 'Profil nenumit'
    };
  }

  return {
    title: `${profileData.user.name || 'Utilizator'} - Profil`,
    description: profileData.user.bio || 'Vezi profilul utilizatorului'
  };
}
