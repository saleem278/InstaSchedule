import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';
import { logger } from './logger';

if (config.features.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary enabled — media uploads will be stored remotely');
} else {
  logger.warn('Cloudinary env vars not set — media uploads will fall back to local disk storage');
}

export { cloudinary };
