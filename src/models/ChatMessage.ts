import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId?: mongoose.Types.ObjectId | null;
  userName: string;
  userAvatar?: string | null;
  message?: string; // plaintext retained for dev; in prod we store encrypted
  iv?: string; // AES-GCM IV (base64)
  ciphertext?: string; // AES-GCM payload (base64)
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true, default: null },
  userName: { type: String, required: true, trim: true },
  userAvatar: { type: String, default: null },
  message: { type: String, default: '', maxlength: 500 },
  iv: { type: String, default: null },
  ciphertext: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

ChatMessageSchema.index({ createdAt: -1 });

// Ensure schema updates take effect in dev/HMR
try { if ((mongoose.models as Record<string, unknown>).ChatMessage) { delete (mongoose.models as Record<string, unknown>).ChatMessage; } } catch {}

export const ChatMessage = models.ChatMessage || model<IChatMessage>('ChatMessage', ChatMessageSchema);


