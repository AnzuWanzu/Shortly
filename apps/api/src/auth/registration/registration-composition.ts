import type { createPrismaClient } from '../../database/prisma';
import { hashPassword } from '../shared/password-hasher';
import { createRegisterUser } from './registration-service';
import { createUserRepository } from '../persistence/user-repository';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeRegistration(
  prisma: PrismaClient,
  issueVerification: Parameters<
    typeof createRegisterUser
  >[0]['issueVerification'],
) {
  const createUser = createUserRepository((args) => prisma.user.create(args));

  return {
    registerUser: createRegisterUser({
      hashPassword,
      createUser,
      issueVerification,
    }),
  };
}
