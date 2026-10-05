import type { createPrismaClient } from '../../database/prisma';
import {
  createDeleteOwnedLinkRepository,
  createLinkRecordRepository,
  createListOwnedLinksRepository,
} from '../persistence/link-repository';
import type { RedirectCache } from '../redirect/redirect-cache';
import { createCreateOwnedLink, createDeleteOwnedLink } from './link-service';
import { createSlug } from './slug';

const MAX_SLUG_ATTEMPTS = 5;

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeLinks(
  prisma: PrismaClient,
  redirectCache: RedirectCache,
) {
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
    deleteOwnedLink: createDeleteOwnedLink({
      deleteLinkRecord: createDeleteOwnedLinkRepository((args) =>
        prisma.link.delete(args),
      ),
      deleteCachedDestination: redirectCache.deleteCachedDestination,
    }),
  };
}
