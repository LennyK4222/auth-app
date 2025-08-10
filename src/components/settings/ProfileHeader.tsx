"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Edit3, 
  Check, 
  X, 
  MapPin, 
  Building, 
  Globe, 
  Calendar,
  Award,
  Star,
  Crown
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface User {
  sub: string;
  email: string;
  name?: string;
}

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { profile, updating, updateProfile, uploadImage } = useProfile();
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleBioEdit = () => {
    setBioText(profile?.bio || '');
    setEditingBio(true);
  };

  const handleBioSave = async () => {
    try {
      await updateProfile({ bio: bioText });
      setEditingBio(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleBioCancel = () => {
    setBioText(profile?.bio || '');
    setEditingBio(false);
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      await uploadImage(file, type);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'avatar');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'cover');
    }
  };

  const badges = [
    { name: 'Verified', icon: Check, color: 'from-blue-500 to-blue-600' },
    { name: 'Pro', icon: Crown, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Expert', icon: Award, color: 'from-purple-500 to-purple-600' },
    { name: 'Popular', icon: Star, color: 'from-pink-500 to-pink-600' }
  ];

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 h-64 animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        {profile.coverImage && (
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => coverInputRef.current?.click()}
          disabled={updating}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <Camera size={16} />
        </motion.button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
      </div>

      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative -mt-16">
            <div className="relative w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden shadow-xl">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name || 'Avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                  {(profile.name || profile.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={updating}
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <Camera size={20} />
              </motion.button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
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

            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {profile.email}
            </p>

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
            <div className="mb-4">
              {editingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Spune-ne ceva despre tine..."
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBioSave}
                      disabled={updating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg text-sm transition-colors"
                    >
                      <Check size={14} />
                      Salvează
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBioCancel}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <X size={14} />
                      Anulează
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-slate-700 dark:text-slate-300 flex-1">
                    {profile.bio || 'Nu ai adăugat încă o descriere...'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBioEdit}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <Edit3 size={16} />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.company && (
                <div className="flex items-center gap-1">
                  <Building size={14} />
                  <span>{profile.company}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Globe size={14} />
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-500 transition-colors"
                  >
                    Website
                  </a>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Membru din {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Level Badge */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {profile.level || 1}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Level</p>
          </div>
        </div>

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Realizări Recente
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.achievements.map((achievement, index) => (
                <motion.span
                  key={achievement}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-700"
                >
                  {achievement}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
