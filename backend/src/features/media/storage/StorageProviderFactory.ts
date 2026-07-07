import { config } from '../../../config/env';
import { StorageProvider } from './StorageProvider.interface';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';
import { LocalDiskStorageProvider } from './LocalDiskStorageProvider';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!cachedProvider) {
    cachedProvider = config.features.cloudinaryEnabled
      ? new CloudinaryStorageProvider()
      : new LocalDiskStorageProvider();
  }
  return cachedProvider;
}
