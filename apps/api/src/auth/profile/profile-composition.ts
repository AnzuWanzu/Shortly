import type { createPrismaClient } from '../../database/prisma';
import { createUpdateUserProfileRepository } from '../persistence/user-repository';
import { createUpdateProfile } from './profile-service';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeProfile(prisma: PrismaClient) {
  const updateUserProfile = createUpdateUserProfileRepository((args) =>
    prisma.user.update(args),
  );

  return {
    updateProfile: createUpdateProfile({ updateUserProfile }),
  };
}
