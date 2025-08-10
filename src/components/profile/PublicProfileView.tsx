"use client";
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  MapPin, 
  Building, 
  Globe, 
  Calendar,
  Award,
  Star,
  Crown,
  Eye,
  MessageCircle,
  Heart,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  level?: number;
  experience?: number;
  badges?: string[];
  profileVisibility?: 'public' | 'friends' | 'private';
  showEmail?: boolean;
  showOnlineStatus?: boolean;
  achievements?: string[];
  stats?: {
    posts: number;
    likesReceived?: number;
    likesGiven?: number;
    likes?: number; // pentru compatibilitate
    comments: number;
    joinedDays: number;
  };
  createdAt?: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  likes: Record<string, boolean>;
  authorName?: string;
  authorEmail?: string;
  authorId?: string;
}

interface PublicProfileViewProps {
  profile: UserProfile;
  recentPosts: Post[];
  likedPosts?: Post[];
}

export function PublicProfileView({ profile, recentPosts, likedPosts = [] }: PublicProfileViewProps) {
  const badges = [
    { name: 'Expert', icon: Award, color: 'from-yellow-400 to-orange-500' },
    { name: 'Social', icon: Heart, color: 'from-pink-400 to-rose-500' },
    { name: 'Author', icon: Eye, color: 'from-blue-400 to-cyan-500' },
    { name: 'Commentator', icon: MessageCircle, color: 'from-green-400 to-emerald-500' },
  ].filter(badge => profile.achievements?.includes(badge.name));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-xl border border-white/20"
        >
          {/* Cover Image */}
          <div className="relative h-32 sm:h-48 -m-6 mb-4 rounded-t-2xl overflow-hidden">
            {profile.coverImage ? (
              <Image 
                src={profile.coverImage} 
                alt="Cover" 
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"></div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative -mt-12 sm:-mt-16">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {profile.avatar ? (
                  <Image 
                    src={profile.avatar} 
                    alt={profile.name || 'Avatar'} 
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {(profile.name || profile.email)?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {profile.name || 'Utilizator Anonim'}
                </h1>
                <div className="flex gap-1">
                  {badges.slice(0, 2).map((badge, index) => (
                    <motion.div
                      key={badge.name}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-6 h-6 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center`}
                      title={badge.name}
                    >
                      <badge.icon size={12} className="text-white" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {profile.showEmail && (
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  {profile.email}
                </p>
              )}

              {/* Role Badge */}
              {profile.role && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    profile.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {profile.role === 'admin' ? (
                      <>
                        <Crown size={14} />
                        Administrator
                      </>
                    ) : (
                      <>
                        <Star size={14} />
                        Utilizator
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Additional Info */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.location}
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-1">
                    <Building size={14} />
                    {profile.company}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Globe size={14} />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Membru de {profile.stats?.joinedDays} zile
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: 'Postări', value: profile.stats?.posts || 0, icon: Eye, color: 'from-blue-500 to-cyan-500' },
            { label: 'Like-uri Date', value: profile.stats?.likesGiven || 0, icon: Heart, color: 'from-red-500 to-pink-500' },
            { label: 'Comentarii', value: profile.stats?.comments || 0, icon: MessageCircle, color: 'from-green-500 to-emerald-500' },
            { label: 'Level', value: profile.level || 1, icon: Award, color: 'from-yellow-500 to-orange-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-4 text-center shadow-lg border border-white/20"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon size={16} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievements */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 mb-6 shadow-lg border border-white/20"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="text-yellow-500" size={20} />
              Realizări
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br ${badge.color} text-white shadow-lg`}
                >
                  <badge.icon size={16} />
                  {badge.name}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="text-blue-500" size={20} />
              Postări Recente
            </h2>
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Link href={`/thread/${post._id}`} className="block">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {Object.keys(post.likes || {}).length}
                        </span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Liked Posts */}
        {likedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 mb-6 shadow-lg border border-white/20"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="text-pink-500" size={20} />
              Postări Pe Care Le-a Apreciat
            </h2>
            <div className="space-y-4">
              {likedPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Link href={`/thread/${post._id}`} className="block">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {post.category}
                        </span>
                        {post.authorName && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            <span 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/profile/${post.authorId}`;
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                            >
                              {post.authorName || post.authorEmail}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {Object.keys(post.likes || {}).length}
                        </span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Users size={16} />
            Înapoi la Feed
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
