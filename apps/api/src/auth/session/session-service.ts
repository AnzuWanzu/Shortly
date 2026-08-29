import type { AuthenticatedUser } from '../login/login-service';
import type { StoredSession } from '../session-repository';
import { UnauthenticatedError } from '../auth-errors';

type SessionDependencies = {
  hashSessionToken: (token: string) => string;
  findSession: (tokenHash: string) => Promise<StoredSession | null>;
  deleteSession: (tokenHash: string) => Promise<void>;
  now: () => Date;
};

export type AuthenticateSession = (
  token: string | undefined,
) => Promise<AuthenticatedUser>;

export type LogoutUser = (token: string | undefined) => Promise<void>;

export function createAuthenticateSession(dependencies: SessionDependencies) {
  return async function authenticateSession(
    token: string | undefined,
  ): Promise<AuthenticatedUser> {
    if (!token) {
      throw new UnauthenticatedError();
    }

    const tokenHash = dependencies.hashSessionToken(token);
    const session = await dependencies.findSession(tokenHash);

    if (!session) {
      throw new UnauthenticatedError();
    }

    if (session.expiresAt.getTime() <= dependencies.now().getTime()) {
      await dependencies.deleteSession(tokenHash);
      throw new UnauthenticatedError();
    }

    return session.user;
  };
}

export function createLogoutUser(dependencies: SessionDependencies) {
  return async function logoutUser(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    const tokenHash = dependencies.hashSessionToken(token);
    await dependencies.deleteSession(tokenHash);
  };
}
