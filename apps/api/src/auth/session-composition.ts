import type { createPrismaClient } from '../database/prisma';
import {
  createDeleteSessionRepository,
  createFindSessionRepository,
} from './session-repository';
import { createAuthenticateSession, createLogoutUser } from './session-service';
import { hashSessionToken } from './session-token';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeSession(prisma: PrismaClient) {
  const findSession = createFindSessionRepository((args) =>
    prisma.session.findUnique(args),
  );
  const deleteSession = createDeleteSessionRepository((args) =>
    prisma.session.deleteMany(args),
  );
  const dependencies = {
    hashSessionToken,
    findSession,
    deleteSession,
    now: () => new Date(),
  };

  return {
    authenticateSession: createAuthenticateSession(dependencies),
    logoutUser: createLogoutUser(dependencies),
  };
}
