import type { createPrismaClient } from '../../database/prisma';
import { createFindRedirectBySlugRepository } from '../persistence/link-repository';
import { createResolveRedirect } from './redirect-service';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeRedirect(prisma: PrismaClient) {
  const findRedirectBySlug = createFindRedirectBySlugRepository((args) =>
    prisma.link.findUnique(args),
  );

  return {
    resolveRedirect: createResolveRedirect({
      findCachedDestination: async () => null,
      findRedirectBySlug,
      cacheDestination: async () => undefined,
    }),
  };
}
