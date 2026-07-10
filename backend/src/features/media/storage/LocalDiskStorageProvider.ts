import fs from 'fs/promises';
import path from 'path';
import { config } from '../../../config/env';
import { StorageProvider, StorageUploadResult } from './StorageProvider.interface';

const UPLOADS_ROOT = path.resolve(__dirname, '../../../../uploads');

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class LocalDiskStorageProvider implements StorageProvider {
  readonly name = 'local';

  async upload(buffer: Buffer, filename: string, userId: string): Promise<StorageUploadResult> {
    const userDir = path.join(UPLOADS_ROOT, userId);
    await fs.mkdir(userDir, { recursive: true });

    const uniqueName = `${Date.now()}-${sanitizeFilename(filename)}`;
    const filePath = path.join(userDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    const relativePublicId = path.posix.join(userId, uniqueName);
    const rootUrl = config.SERVER_URL?.replace(/\/+$/, '');
    const url = rootUrl ? `${rootUrl}/uploads/${relativePublicId}` : `/uploads/${relativePublicId}`;

    return {
      url,
      publicId: relativePublicId,
      // NOTE: image dimension probing (width/height) is intentionally left undefined
      // here to avoid adding a new npm dependency (e.g. `image-size`) just for the
      // local-disk fallback path. Cloudinary's upload response already includes
      // width/height natively, so only the local provider has this gap.
    };
  }

  async delete(publicId: string): Promise<void> {
    const filePath = path.resolve(UPLOADS_ROOT, publicId);
    // Defense-in-depth: `publicId` is server-generated today, but never let a
    // join escape the uploads root (arbitrary-file-delete) if that invariant
    // ever breaks (e.g. a provider-switch mismatch feeding a foreign id here).
    if (filePath !== UPLOADS_ROOT && !filePath.startsWith(UPLOADS_ROOT + path.sep)) {
      return;
    }
    try {
      await fs.unlink(filePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
