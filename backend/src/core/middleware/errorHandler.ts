import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../errors/AppError';
import { logger } from '../../config/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Multer raises its own error class (not an AppError) for upload problems —
  // most importantly the file-size limit. Translate to a 422 with a helpful
  // message so the client shows "file too large" instead of a generic 500.
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image exceeds the 10MB upload limit.'
        : `Upload failed: ${err.message}`;
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message },
    });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}
