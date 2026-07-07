import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../../../config/cloudinary';
import { ExternalServiceError } from '../../../core/errors/AppError';
import { StorageProvider, StorageUploadResult } from './StorageProvider.interface';

export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'cloudinary';

  async upload(buffer: Buffer, _filename: string, userId: string): Promise<StorageUploadResult> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `instapost/${userId}`, resource_type: 'image' },
        (error: UploadApiErrorResponse | undefined, uploadResult: UploadApiResponse | undefined) => {
          if (error || !uploadResult) {
            reject(new ExternalServiceError('Failed to upload image to Cloudinary', error));
            return;
          }
          resolve(uploadResult);
        }
      );
      uploadStream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
