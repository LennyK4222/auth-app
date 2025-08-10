import mongoose, { Schema, models, model } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorEmail: string;
  authorName?: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authorEmail: { type: String, required: true },
  authorName: { type: String },
  body: { type: String, required: true, maxlength: 5000 },
}, { timestamps: true });

CommentSchema.index({ createdAt: -1 });

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema);
