import { Express } from 'express';
import passport from 'passport';
import { config } from '../../config/env';
import { logger } from '../../config/logger';
import * as authController from './auth.controller';

export function mountGoogleOAuthRoutes(app: Express): void {
  if (!config.features.googleAuthEnabled) {
    logger.warn('Google OAuth routes are disabled (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not configured)');
    return;
  }

  app.get('/api/v1/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  app.get(
    '/api/v1/auth/google/callback',
    passport.authenticate('google', { session: false }),
    authController.googleCallback
  );
}
