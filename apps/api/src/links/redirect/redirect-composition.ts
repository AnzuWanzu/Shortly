import type { createPrismaClient } from '../../database/prisma';
import { createFindRedirectBySlugRepository } from '../persistence/link-repository';
import { createResolveRedirect } from './redirect-service';
import type { RedirectCache } from './redirect-cache';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeRedirect(
  prisma: PrismaClient,
  redirectCache: RedirectCache,
) {
  const findRedirectBySlug = createFindRedirectBySlugRepository((args) =>
    prisma.link.findUnique(args),
  );
  return {
    resolveRedirect: createResolveRedirect({
      ...redirectCache,
      findRedirectBySlug,
    }),
  };
}
