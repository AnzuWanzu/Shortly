import { Router } from 'express';
import type { AuthenticateSession } from '../session/session-service';
import type { UpdateProfile } from './profile-service';

type ProfileRouterDependencies = {
  authenticateSession: AuthenticateSession;
  updateProfile: UpdateProfile;
};

export function createProfileRouter(_dependencies: ProfileRouterDependencies) {
  const router = Router();

  router.patch('/me', (_request, response) => {
    response.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' },
    });
  });

  return router;
}
