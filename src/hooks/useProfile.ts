"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin' | 'moderator';
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
  allowMessages?: 'everyone' | 'friends' | 'none';
  notifications?: {
    email: boolean;
    push: boolean;
    sound: boolean;
    comments: boolean;
    likes: boolean;
    follows: boolean;
    mentions: boolean;
  };
  dataCollection?: {
    analytics: boolean;
    personalization: boolean;
    marketing: boolean;
    thirdParty: boolean;
  };
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
  updatedAt?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/user/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const result = await response.json();
      setProfile(prev => prev ? { ...prev, ...result.user } : result.user);
      toast.success('Image uploaded successfully');
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const updateNotifications = async (notifications: UserProfile['notifications']) => {
    return updateProfile({ notifications });
  };

  const updatePrivacySettings = async (settings: {
    profileVisibility?: UserProfile['profileVisibility'];
    showEmail?: boolean;
    showOnlineStatus?: boolean;
    allowMessages?: UserProfile['allowMessages'];
    dataCollection?: UserProfile['dataCollection'];
  }) => {
    return updateProfile(settings);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updating,
    fetchProfile,
    updateProfile,
    uploadImage,
    updateNotifications,
    updatePrivacySettings
  };
}
