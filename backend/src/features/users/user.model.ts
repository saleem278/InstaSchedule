import { Schema, model, Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  name: string;
  avatarUrl?: string;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>('User', userSchema);
