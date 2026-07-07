export interface StorageUploadResult {
  url: string;
  publicId: string | null;
  width?: number;
  height?: number;
  format?: string;
}

export interface StorageProvider {
  readonly name: string;
  upload(buffer: Buffer, filename: string, userId: string): Promise<StorageUploadResult>;
  delete(publicId: string): Promise<void>;
}
