import mongoose, { Schema, models, model } from 'mongoose';

export interface IPost {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorEmail: string;
  authorName?: string;
  title: string;
  body: string;
  category?: string; // Category slug
  score: number;
  votes: Record<string, 1 | -1>; // key=userId, value=vote
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authorEmail: { type: String, required: true },
  authorName: { type: String },
  title: { type: String, required: true, maxlength: 140 },
  body: { type: String, required: true, maxlength: 5000 },
  category: { type: String, index: true }, // Category slug for filtering
  score: { type: Number, default: 0, index: true },
  votes: { type: Schema.Types.Mixed, default: {} },
  commentsCount: { type: Number, default: 0 },
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 }); // Index for category filtering

export const Post = models.Post || model<IPost>('Post', PostSchema);
