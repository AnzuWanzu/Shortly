import { Router } from 'express';
import { UnauthenticatedError } from '../shared/auth-errors';
import {
  readSessionCookie,
  requireCsrfHeader,
} from '../session/session-router';
import type { AuthenticateSession } from '../session/session-service';
import { profileUpdateSchema } from './profile-schema';
import type { UpdateProfile } from './profile-service';

type ProfileRouterDependencies = {
  authenticateSession: AuthenticateSession;
  updateProfile: UpdateProfile;
};

export function createProfileRouter(dependencies: ProfileRouterDependencies) {
  const router = Router();

  router.patch('/me', requireCsrfHeader, async (request, response) => {
    try {
      const user = await dependencies.authenticateSession(
        readSessionCookie(request),
      );
      const parsedInput = profileUpdateSchema.safeParse(request.body);

      if (!parsedInput.success) {
        response.status(400).json({
          error: {
            code: 'INVALID_PROFILE_INPUT',
            message: 'Profile data is invalid',
            issues: parsedInput.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const updatedUser = await dependencies.updateProfile({
        userId: user.id,
        ...parsedInput.data,
      });
      response.status(200).json({ user: updatedUser });
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        response.status(401).json({
          error: { code: 'UNAUTHENTICATED', message: error.message },
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to update profile',
        },
      });
    }
  });

  return router;
}
