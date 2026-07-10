import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { config } from './config/env';
import { configurePassport } from './config/passport';
import { notFoundHandler, errorHandler } from './core/middleware/errorHandler';
import { sendSuccess } from './core/utils/apiResponse';
import { authRouter } from './features/auth/auth.routes';
import { mountGoogleOAuthRoutes } from './features/auth/google-oauth.routes';
import { brandRouter } from './features/brands/brand.routes';
import { projectRouter } from './features/projects/project.routes';
import { generationRouter } from './features/ai-generation/generation.routes';
import { mediaRouter } from './features/media/media.routes';
import { schedulerRouter } from './features/scheduler/scheduler.routes';
import { providersRouter } from './features/system/providers.routes';

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      // This is a JSON API whose only browser-rendered content is the images
      // under /uploads, loaded cross-origin by the SPA. Disable helmet's CSP
      // (it targets HTML apps, not a JSON API, and its defaults would block the
      // SPA origin) and relax Cross-Origin-Resource-Policy to cross-origin so
      // the frontend can load /uploads images. The other headers (HSTS,
      // nosniff, frameguard, etc.) apply as sensible defaults.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  configurePassport();
  app.use(passport.initialize());

  app.use(
    '/uploads',
    express.static(path.resolve(__dirname, '../uploads'), {
      // Uploaded files are user-supplied and served from the app origin. Stop
      // browsers from MIME-sniffing a non-image upload into executable content
      // (e.g. HTML/JS), and don't cache aggressively.
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    })
  );

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    sendSuccess(res, { status: 'ok' });
  });

  app.use('/api/v1/auth', authRouter);
  mountGoogleOAuthRoutes(app);
  app.use('/api/v1/brands', brandRouter);
  app.use('/api/v1/projects', projectRouter);
  app.use('/api/v1/generation', generationRouter);
  app.use('/api/v1/providers', providersRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/scheduler', schedulerRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
