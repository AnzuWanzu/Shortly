import { Router } from 'express';
import { requireCsrfHeader } from '../session/session-router';
import {
  resendVerificationSchema,
  verifyEmailSchema,
} from './verification-schema';
import { EmailVerificationCodeInvalidError } from './verification-service';

type VerificationRouterDependencies = {
  verifyEmail: (input: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
};

export function createVerificationRouter(
  dependencies: VerificationRouterDependencies,
) {
  const router = Router();

  router.post('/verify-email', requireCsrfHeader, async (request, response) => {
    const parsedInput = verifyEmailSchema.safeParse(request.body);
    if (!parsedInput.success) {
      response.status(400).json({
        error: {
          code: 'INVALID_VERIFICATION_INPUT',
          message: 'Verification data is invalid',
        },
      });
      return;
    }

    try {
      await dependencies.verifyEmail(parsedInput.data);
      response.status(200).json({ verified: true });
    } catch (error) {
      if (error instanceof EmailVerificationCodeInvalidError) {
        response.status(400).json({
          error: {
            code: 'INVALID_VERIFICATION_CODE',
            message: error.message,
          },
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to verify email',
        },
      });
    }
  });

  router.post(
    '/resend-verification',
    requireCsrfHeader,
    async (request, response) => {
      const parsedInput = resendVerificationSchema.safeParse(request.body);
      if (parsedInput.success) {
        try {
          await dependencies.resendVerification(parsedInput.data.email);
        } catch {
          // Preserve the generic response to avoid revealing account state.
        }
      }

      response.status(202).json({ accepted: true });
    },
  );

  return router;
}
