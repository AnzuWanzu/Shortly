import { Router } from 'express';
import type { LoginUser } from './login-service';
import type { AuthenticateSession, LogoutUser } from './session-service';

export const SESSION_COOKIE_NAME = 'shortly_session';
export const CSRF_HEADER_NAME = 'x-shortly-csrf';
export const CSRF_HEADER_VALUE = '1';

type SessionRouterDependencies = {
  loginUser: LoginUser;
  authenticateSession: AuthenticateSession;
  logoutUser: LogoutUser;
  secureCookies: boolean;
};

export function createSessionRouter(_dependencies: SessionRouterDependencies) {
  const router = Router();

  router.post('/login', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  router.get('/me', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  router.post('/logout', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  return router;
}
