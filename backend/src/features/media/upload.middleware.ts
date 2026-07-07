import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ValidationError } from '../../core/errors/AppError';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  if (!file.mimetype.startsWith('image/')) {
    callback(new ValidationError('Only image files are allowed'));
    return;
  }
  callback(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

export const uploadSingleImage = upload.single('file');
