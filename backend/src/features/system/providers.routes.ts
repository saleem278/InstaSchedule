import { Router } from 'express';
import { listProviders } from './providers.controller';

export const providersRouter = Router();

providersRouter.get('/', listProviders);
