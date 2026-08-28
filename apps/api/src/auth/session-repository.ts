import type { AuthenticatedUser, CreateSessionInput } from './login-service';

export type StoredSession = {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

type PrismaCreateSession = (args: {
  data: CreateSessionInput;
}) => Promise<unknown>;

type PrismaFindSession = (args: {
  where: { tokenHash: string };
  select: {
    id: true;
    tokenHash: true;
    expiresAt: true;
    user: {
      select: {
        id: true;
        email: true;
        displayName: true;
        createdAt: true;
      };
    };
  };
}) => Promise<StoredSession | null>;

type PrismaDeleteSessions = (args: {
  where: { tokenHash: string };
}) => Promise<{ count: number }>;

export function createCreateSessionRepository(
  _prismaCreateSession: PrismaCreateSession,
) {
  return async function createSession(
    _input: CreateSessionInput,
  ): Promise<void> {
    throw new Error('Not implemented');
  };
}

export function createFindSessionRepository(
  _prismaFindSession: PrismaFindSession,
) {
  return async function findSession(
    _tokenHash: string,
  ): Promise<StoredSession | null> {
    throw new Error('Not implemented');
  };
}

export function createDeleteSessionRepository(
  _prismaDeleteSessions: PrismaDeleteSessions,
) {
  return async function deleteSession(_tokenHash: string): Promise<void> {
    throw new Error('Not implemented');
  };
}
