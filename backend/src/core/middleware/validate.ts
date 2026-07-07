import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const zodError = result.error as ZodError;
      next(new ValidationError('Invalid request data', zodError.flatten().fieldErrors));
      return;
    }
    req[part] = result.data;
    next();
  };
}
