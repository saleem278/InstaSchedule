import { FilterQuery, Types } from 'mongoose';
import { MediaAssetModel, MediaAssetDocument } from './media.model';
import { CollectionModel, CollectionDocument } from './collection.model';
import { CreateCollectionInput, UpdateCollectionInput, UpdateAssetInput } from './media.validation';

export interface ListFilters {
  isFavorite?: boolean;
  collectionId?: string;
  brandId?: string;
  search?: string;
}

/** Escapes regex metacharacters so user input matches as a literal substring. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ListResult {
  items: MediaAssetDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAssetInput {
  user: string;
  brand?: string | null;
  source: 'upload' | 'ai-generated';
  url: string;
  publicId?: string | null;
  storageProvider: 'cloudinary' | 'local';
  width?: number;
  height?: number;
  format?: string;
  generation?: string | null;
  tags?: string[];
}

export async function list(userId: string, filters: ListFilters, page: number, limit: number): Promise<ListResult> {
  const query: FilterQuery<MediaAssetDocument> = { user: userId };

  if (filters.isFavorite !== undefined) {
    query.isFavorite = filters.isFavorite;
  }
  if (filters.collectionId) {
    query.collections = filters.collectionId;
  }
  if (filters.brandId) {
    query.brand = filters.brandId;
  }
  if (filters.search) {
    // NOTE: using a $regex match on `tags` rather than the schema's $text index.
    // $text indexes require the whole-word/stemmed query syntax and only support
    // one text query per compound query, which is more restrictive than a simple
    // partial/substring "search-as-you-type" experience over tags. A regex scan
    // is fine at this collection's expected scale (per-user media libraries).
    //
    // Escape the user input so it's treated as a LITERAL substring — passing it
    // raw as a regex source lets a user submit a catastrophic-backtracking
    // pattern (e.g. `(a+)+$`) that pins a DB core (ReDoS). Cap length too.
    query.tags = { $regex: escapeRegex(filters.search.slice(0, 100)), $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MediaAssetModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<MediaAssetDocument[]>()
      .exec(),
    MediaAssetModel.countDocuments(query).exec(),
  ]);

  return { items, total, page, limit };
}

export async function findByIdForUser(id: string, userId: string): Promise<MediaAssetDocument | null> {
  return MediaAssetModel.findOne({ _id: id, user: userId }).lean<MediaAssetDocument>().exec();
}

export async function create(data: CreateAssetInput): Promise<MediaAssetDocument> {
  const asset = await MediaAssetModel.create(data);
  return asset.toObject();
}

export async function update(
  id: string,
  userId: string,
  data: UpdateAssetInput
): Promise<MediaAssetDocument | null> {
  return MediaAssetModel.findOneAndUpdate({ _id: id, user: userId }, { $set: data }, { new: true })
    .lean<MediaAssetDocument>()
    .exec();
}

export async function remove(id: string, userId: string): Promise<void> {
  await MediaAssetModel.deleteOne({ _id: id, user: userId }).exec();
}

// ---- Collections ----

export async function listCollections(userId: string): Promise<CollectionDocument[]> {
  return CollectionModel.find({ user: userId }).sort({ createdAt: -1 }).lean<CollectionDocument[]>().exec();
}

export async function findCollectionByIdForUser(id: string, userId: string): Promise<CollectionDocument | null> {
  return CollectionModel.findOne({ _id: id, user: userId }).lean<CollectionDocument>().exec();
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput
): Promise<CollectionDocument> {
  const collection = await CollectionModel.create({ ...data, user: userId });
  return collection.toObject();
}

export async function updateCollection(
  id: string,
  userId: string,
  data: UpdateCollectionInput
): Promise<CollectionDocument | null> {
  return CollectionModel.findOneAndUpdate({ _id: id, user: userId }, { $set: data }, { new: true })
    .lean<CollectionDocument>()
    .exec();
}

export async function deleteCollection(id: string, userId: string): Promise<void> {
  await CollectionModel.deleteOne({ _id: id, user: userId }).exec();
}

export async function addAssetToCollection(
  collectionId: string,
  assetId: string,
  userId: string
): Promise<MediaAssetDocument | null> {
  return MediaAssetModel.findOneAndUpdate(
    { _id: assetId, user: userId },
    { $addToSet: { collections: new Types.ObjectId(collectionId) } },
    { new: true }
  )
    .lean<MediaAssetDocument>()
    .exec();
}

export async function removeAssetFromCollection(
  collectionId: string,
  assetId: string,
  userId: string
): Promise<MediaAssetDocument | null> {
  return MediaAssetModel.findOneAndUpdate(
    { _id: assetId, user: userId },
    { $pull: { collections: new Types.ObjectId(collectionId) } },
    { new: true }
  )
    .lean<MediaAssetDocument>()
    .exec();
}
