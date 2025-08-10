import mongoose, { Schema, models, model } from 'mongoose';

export interface ICategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, maxlength: 500 },
  color: { type: String, required: true },
  icon: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  postCount: { type: Number, default: 0 },
}, { timestamps: true });

// Only add custom indexes, avoid duplicating unique indexes
CategorySchema.index({ isActive: 1 });

export const Category = models.Category || model<ICategory>('Category', CategorySchema);
