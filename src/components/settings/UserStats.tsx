"use client";
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Calendar,
  Target,
  Award,
  Star,
  Zap
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';


export function UserStats() {
  const { profile, loading } = useProfile();

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const level = profile.level || 1;
  const experience = profile.experience || 0;
  const nextLevelXP = level * 1000;
  const currentLevelXP = (level - 1) * 1000;
  const progressXP = experience - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((progressXP / neededXP) * 100, 100);

  type Stats = { posts: number; likesGiven: number; comments: number; joinedDays: number };
  const stats: Stats = {
    posts: profile.stats?.posts ?? 0,
    likesGiven: profile.stats?.likesGiven ?? profile.stats?.likes ?? 0,
    comments: profile.stats?.comments ?? 0,
    joinedDays: profile.stats?.joinedDays ?? 0,
  };

  const achievements = [
    { name: 'First Post', icon: Target, earned: stats.posts >= 1, description: 'Scrie primul post' },
    { name: 'Social', icon: Heart, earned: stats.likesGiven >= 10, description: 'Dă 10 like-uri' },
    { name: 'Conversationalist', icon: MessageSquare, earned: stats.comments >= 5, description: 'Scrie 5 comentarii' },
    { name: 'Veteran', icon: Calendar, earned: stats.joinedDays >= 30, description: 'Membru de 30 de zile' },
    { name: 'Expert', icon: Award, earned: level >= 5, description: 'Ajunge la level 5' },
    { name: 'Social Pro', icon: Star, earned: stats.likesGiven >= 100, description: 'Dă 100 like-uri' }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const nextAchievements = achievements.filter(a => !a.earned).slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Level {level}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {progressXP}/{neededXP} XP până la level {level + 1}
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Level {level}</span>
            <span>{Math.round(progressPercent)}%</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </motion.div>

      {/* Activity Stats */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Statistici Activitate
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Activitatea ta pe platformă
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.posts}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Postări</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.likesGiven}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Like-uri date</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.comments}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comentarii</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.joinedDays}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Zile</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Realizări
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {earnedAchievements.length}/{achievements.length} deblocate
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {earnedAchievements.slice(0, 3).map((achievement, index) => (
              <motion.div
                key={achievement.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <achievement.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {achievement.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {achievement.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {nextAchievements.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Următoarele ținte:
                </p>
                {nextAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl opacity-60"
                  >
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <achievement.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                        {achievement.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {achievement.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
