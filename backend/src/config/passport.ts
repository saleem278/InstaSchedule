import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { config } from './env';
import { logger } from './logger';
import * as authRepository from '../features/auth/auth.repository';

export function configurePassport(): void {
  if (!config.features.googleAuthEnabled) {
    logger.warn('Google OAuth is not configured; skipping passport Google strategy setup');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID as string,
        clientSecret: config.GOOGLE_CLIENT_SECRET as string,
        callbackURL: config.GOOGLE_CALLBACK_URL as string,
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error('Google account has no email address'));
            return;
          }

          const user = await authRepository.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName || email,
            avatarUrl: profile.photos?.[0]?.value,
          });

          done(null, { id: user._id.toString() });
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}
