import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  // optional flows
  pendingEmail?: string;
  emailChangeToken?: string;
  emailChangeTokenExp?: Date;
  resetToken?: string;
  resetTokenExp?: Date;
  lastLoginAt?: Date;
  lastSeenAt?: Date;
  // Profile fields
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  level?: number;
  experience?: number;
  badges?: string[];
  // Privacy settings
  profileVisibility?: 'public' | 'friends' | 'private';
  showEmail?: boolean;
  showOnlineStatus?: boolean;
  allowMessages?: 'everyone' | 'friends' | 'none';
  // Notification settings
  notifications?: {
    email: boolean;
    push: boolean;
    sound: boolean;
    comments: boolean;
    likes: boolean;
    follows: boolean;
    mentions: boolean;
  };
  // Data collection preferences
  dataCollection?: {
    analytics: boolean;
    personalization: boolean;
    marketing: boolean;
    thirdParty: boolean;
  };
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    pendingEmail: { type: String },
    emailChangeToken: { type: String, index: true },
    emailChangeTokenExp: { type: Date },
    resetToken: { type: String, index: true },
    resetTokenExp: { type: Date },
    lastLoginAt: { type: Date, index: true },
    lastSeenAt: { type: Date, index: true },
    // Profile fields
    bio: { type: String, maxlength: 500 },
    company: { type: String },
    location: { type: String },
    website: { type: String },
    avatar: { type: String },
    coverImage: { type: String },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    badges: [{ type: String }],
    // Privacy settings
    profileVisibility: { 
      type: String, 
      enum: ['public', 'friends', 'private'], 
      default: 'public' 
    },
    showEmail: { type: Boolean, default: false },
    showOnlineStatus: { type: Boolean, default: true },
    allowMessages: { 
      type: String, 
      enum: ['everyone', 'friends', 'none'], 
      default: 'everyone' 
    },
    // Notification settings
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true }
    },
    // Data collection preferences
    dataCollection: {
      analytics: { type: Boolean, default: true },
      personalization: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      thirdParty: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
