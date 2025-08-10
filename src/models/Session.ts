import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    browser?: string;
    os?: string;
    device?: string;
  };
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    userAgent: { type: String, required: true },
    ip: { type: String, required: true },
    browser: String,
    os: String,
    device: String
  },
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

// Index pentru căutări eficiente
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ lastActivity: 1 });

export const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
