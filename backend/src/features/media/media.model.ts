import { Schema, model, Document, Types } from 'mongoose';

export type MediaSource = 'upload' | 'ai-generated';
export type StorageProviderName = 'cloudinary' | 'local';

export interface MediaAssetDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  brand?: Types.ObjectId | null;
  source: MediaSource;
  url: string;
  publicId?: string | null;
  storageProvider: StorageProviderName;
  width?: number;
  height?: number;
  format?: string;
  isFavorite: boolean;
  collections: Types.ObjectId[];
  generation?: Types.ObjectId | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<MediaAssetDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
    source: { type: String, enum: ['upload', 'ai-generated'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    storageProvider: { type: String, enum: ['cloudinary', 'local'], required: true },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    isFavorite: { type: Boolean, default: false, index: true },
    collections: { type: [Schema.Types.ObjectId], ref: 'Collection', default: [] },
    generation: { type: Schema.Types.ObjectId, ref: 'Generation', default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

mediaAssetSchema.index({ tags: 'text' });
mediaAssetSchema.index({ user: 1, createdAt: -1 });
mediaAssetSchema.index({ user: 1, isFavorite: 1 });

export const MediaAssetModel = model<MediaAssetDocument>('MediaAsset', mediaAssetSchema);
