import type {
  AuthenticatedUser,
  CreateSessionInput,
} from './login/login-service';

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
  prismaCreateSession: PrismaCreateSession,
) {
  return async function createSession(
    input: CreateSessionInput,
  ): Promise<void> {
    await prismaCreateSession({ data: input });
  };
}

export function createFindSessionRepository(
  prismaFindSession: PrismaFindSession,
) {
  return async function findSession(
    tokenHash: string,
  ): Promise<StoredSession | null> {
    return prismaFindSession({
      where: { tokenHash },
      select: {
        id: true,
        tokenHash: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            createdAt: true,
          },
        },
      },
    });
  };
}

export function createDeleteSessionRepository(
  prismaDeleteSessions: PrismaDeleteSessions,
) {
  return async function deleteSession(tokenHash: string): Promise<void> {
    await prismaDeleteSessions({ where: { tokenHash } });
  };
}
