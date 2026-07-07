import { Schema, model, Document, Types } from 'mongoose';

export interface BrandDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  logoUrl?: string;
  colors?: string[];
  fonts?: string[];
  tone?: string;
  audience?: string;
  website?: string;
  instagramUsername?: string;
  /** IG Business/Creator account id used as the Graph API publish target. */
  instagramUserId?: string;
  /** Long-lived Page access token authorized for content_publish on the linked IG account. */
  instagramAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<BrandDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String },
    colors: { type: [String], default: undefined },
    fonts: { type: [String], default: undefined },
    tone: { type: String },
    audience: { type: String },
    website: { type: String },
    instagramUsername: { type: String },
    instagramUserId: { type: String },
    // NOTE: stored as-is. A production build should encrypt this at rest; the
    // read-path projection in brand.repository never returns it to the client
    // (see findAllByUser/findByIdForUser select exclusions).
    instagramAccessToken: { type: String, select: false },
  },
  { timestamps: true }
);

brandSchema.index({ user: 1, createdAt: -1 });

export const BrandModel = model<BrandDocument>('Brand', brandSchema);
