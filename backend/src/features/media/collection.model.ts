import { Schema, model, Document, Types } from 'mongoose';

export interface CollectionDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  description?: string;
  coverAsset?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<CollectionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    coverAsset: { type: Schema.Types.ObjectId, ref: 'MediaAsset', default: null },
  },
  { timestamps: true }
);

collectionSchema.index({ user: 1, name: 1 }, { unique: true });

export const CollectionModel = model<CollectionDocument>('Collection', collectionSchema);
