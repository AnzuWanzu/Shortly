import { rateLimit } from 'express-rate-limit';

const standardOptions = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
};

export function createVerificationRateLimits() {
  return {
    verifyEmailRateLimit: rateLimit({
      ...standardOptions,
      windowMs: 10 * 60 * 1000,
      limit: 10,
      message: {
        error: {
          code: 'TOO_MANY_VERIFICATION_ATTEMPTS',
          message: 'Too many verification attempts. Try again later.',
        },
      },
    }),
    resendVerificationRateLimit: rateLimit({
      ...standardOptions,
      windowMs: 60 * 1000,
      limit: 3,
      message: {
        error: {
          code: 'TOO_MANY_VERIFICATION_REQUESTS',
          message: 'Too many verification requests. Try again later.',
        },
      },
    }),
  };
}
