import type { createPrismaClient } from '../../database/prisma';
import { hashPassword } from '../password-hasher';
import { createRegisterUser } from './registration-service';
import { createUserRepository } from '../user-repository';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeRegistration(prisma: PrismaClient) {
  const createUser = createUserRepository((args) => prisma.user.create(args));

  return {
    registerUser: createRegisterUser({ hashPassword, createUser }),
  };
}
