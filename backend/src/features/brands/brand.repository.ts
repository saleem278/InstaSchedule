import mongoose from 'mongoose';
import { BrandModel, BrandDocument } from './brand.model';
import { CreateBrandInput, UpdateBrandInput } from './brand.validation';
import { encryptSecret, decryptSecret } from '../../core/utils/secretCrypto';

// These reads include the token (via +select) ONLY so the service can derive a
// correct `instagramConnected` boolean from BOTH the userId and token being
// present; toBrandResponse then strips the token before it ever reaches a
// client. Reads that must not carry the secret at all use nothing here — the
// stripping is centralized in the service layer.
export async function findAllByUser(userId: string): Promise<BrandDocument[]> {
  return BrandModel.find({ user: userId })
    .select('+instagramAccessToken')
    .sort({ createdAt: -1 })
    .lean<BrandDocument[]>()
    .exec();
}

export async function findByIdForUser(id: string, userId: string): Promise<BrandDocument | null> {
  return BrandModel.findOne({ _id: id, user: userId })
    .select('+instagramAccessToken')
    .lean<BrandDocument>()
    .exec();
}

/**
 * Like findByIdForUser but explicitly includes the `instagramAccessToken`
 * field (which is `select: false` on the schema, so the default reads never
 * return it to the client). Used only by the publishing path, which needs the
 * token to authenticate the Graph API call. Decrypts the token at rest so the
 * caller receives the usable plaintext (legacy plaintext values pass through).
 */
export async function findByIdWithToken(id: string, userId: string): Promise<BrandDocument | null> {
  const brand = await BrandModel.findOne({ _id: id, user: userId })
    .select('+instagramAccessToken')
    .lean<BrandDocument>()
    .exec();
  if (brand?.instagramAccessToken) {
    brand.instagramAccessToken = decryptSecret(brand.instagramAccessToken) ?? undefined;
  }
  return brand;
}

export async function create(userId: string, data: CreateBrandInput): Promise<BrandDocument> {
  const payload = { ...data, user: userId };
  if (payload.instagramAccessToken) {
    payload.instagramAccessToken = encryptSecret(payload.instagramAccessToken);
  }
  const brand = await BrandModel.create(payload);
  return brand.toObject();
}

export async function update(id: string, userId: string, data: UpdateBrandInput): Promise<BrandDocument | null> {
  // Empty-string Instagram connection fields mean "clear this field" (disconnect);
  // translate them to $unset so they're removed rather than stored as ''. All
  // other fields go through $set as normal.
  const set: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};
  const igFields = ['instagramUserId', 'instagramAccessToken'] as const;

  for (const [key, value] of Object.entries(data)) {
    if ((igFields as readonly string[]).includes(key) && value === '') {
      unset[key] = '';
    } else if (key === 'instagramAccessToken' && typeof value === 'string' && value !== '') {
      // Encrypt the token at rest before it's written.
      set[key] = encryptSecret(value);
    } else {
      set[key] = value;
    }
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(unset).length > 0) update.$unset = unset;

  return BrandModel.findOneAndUpdate({ _id: id, user: userId }, update, { new: true })
    .lean<BrandDocument>()
    .exec();
}

export async function remove(id: string, userId: string): Promise<void> {
  await BrandModel.deleteOne({ _id: id, user: userId }).exec();
}

/**
 * Counts projects referencing this brand.
 *
 * NOTE: We intentionally query the raw `projects` collection via
 * `mongoose.connection.collection('projects')` instead of importing the Project
 * model. The Projects feature is not built yet (and even once it is, importing
 * its model here would create a cross-feature/circular dependency between
 * brands <-> projects). Querying the collection by name keeps this feature
 * self-contained and avoids any import-order/circular-require issues, at the
 * cost of losing Mongoose schema validation/casting for this one read-only count.
 */
export async function countProjectsForBrand(brandId: string): Promise<number> {
  return mongoose.connection
    .collection('projects')
    .countDocuments({ brand: new mongoose.Types.ObjectId(brandId) });
}
