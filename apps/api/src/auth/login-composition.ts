import type { createPrismaClient } from '../database/prisma';
import { DUMMY_PASSWORD_HASH, verifyPassword } from './password-hasher';
import { SESSION_DURATION_MS, createLoginUser } from './login-service';
import { createCreateSessionRepository } from './session-repository';
import { createSessionToken, hashSessionToken } from './session-token';
import { createFindUserByEmailRepository } from './user-repository';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeLogin(prisma: PrismaClient) {
  const findUserByEmail = createFindUserByEmailRepository((args) =>
    prisma.user.findUnique(args),
  );
  const createSession = createCreateSessionRepository((args) =>
    prisma.session.create(args),
  );

  return {
    loginUser: createLoginUser({
      findUserByEmail,
      verifyPassword,
      createSession,
      createSessionToken,
      hashSessionToken,
      now: () => new Date(),
      sessionDurationMs: SESSION_DURATION_MS,
      dummyPasswordHash: DUMMY_PASSWORD_HASH,
    }),
  };
}
