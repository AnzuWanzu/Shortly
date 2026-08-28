import type { AuthenticatedUser } from './login-service';
import type { StoredSession } from './session-repository';

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

export function createAuthenticateSession(_dependencies: SessionDependencies) {
  return async function authenticateSession(
    _token: string | undefined,
  ): Promise<AuthenticatedUser> {
    throw new Error('Not implemented');
  };
}

export function createLogoutUser(_dependencies: SessionDependencies) {
  return async function logoutUser(_token: string | undefined): Promise<void> {
    throw new Error('Not implemented');
  };
}
