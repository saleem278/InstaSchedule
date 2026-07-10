import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../core/middleware/validate';
import { authenticate } from '../../core/middleware/authenticate';
import { registerSchema, loginSchema } from './auth.validation';
import * as authController from './auth.controller';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later.' } },
});

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
// Logout is intentionally NOT behind `authenticate`: tearing down a session
// must work even when the access token has already expired. The controller
// clears cookies unconditionally and best-effort revokes the stored refresh
// hash from whichever token is presented.
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
authRouter.get('/config', authController.getAuthConfig);
