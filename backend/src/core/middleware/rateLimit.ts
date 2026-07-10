import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Per-user rate limiter for expensive authenticated endpoints (AI generation,
 * uploads). These call paid LLM/image providers on every request, so an
 * authenticated user could otherwise script thousands of calls and run up the
 * bill / exhaust provider quotas ("denial of wallet"). Keyed on the
 * authenticated user id (falls back to IP if somehow unauthenticated).
 *
 * `authenticate` runs before these routers, so `req.user` is populated.
 */
export const generationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // generous for interactive use (full gen + several field regens), abusive for scripts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'anonymous',
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'You are generating too quickly. Please wait a moment and try again.' },
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'anonymous',
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many uploads. Please wait a moment and try again.' },
  },
});
