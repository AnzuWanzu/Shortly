import type { createPrismaClient } from '../../database/prisma';
import {
  createDeleteOwnedLinkRepository,
  createLinkRecordRepository,
  createListOwnedLinksRepository,
} from '../link-repository';
import { createCreateOwnedLink } from './link-service';
import { createSlug } from './slug';

const MAX_SLUG_ATTEMPTS = 5;

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeLinks(prisma: PrismaClient) {
  const createLinkRecord = createLinkRecordRepository((args) =>
    prisma.link.create(args),
  );

  return {
    createOwnedLink: createCreateOwnedLink({
      createLinkRecord,
      createSlug,
      maxSlugAttempts: MAX_SLUG_ATTEMPTS,
    }),
    listOwnedLinks: createListOwnedLinksRepository((args) =>
      prisma.link.findMany(args),
    ),
    deleteOwnedLink: createDeleteOwnedLinkRepository((args) =>
      prisma.link.deleteMany(args),
    ),
  };
}
