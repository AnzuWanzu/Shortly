import type { createPrismaClient } from '../../database/prisma';
import { createFindRedirectBySlugRepository } from '../persistence/link-repository';
import { createResolveRedirect } from './redirect-service';
import type { RedisClient } from '../../cache/redis';
import { createRedirectCache } from './redirect-cache';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeRedirect(
  prisma: PrismaClient,
  redis: RedisClient,
  ttlSeconds: number,
) {
  const findRedirectBySlug = createFindRedirectBySlugRepository((args) =>
    prisma.link.findUnique(args),
  );
  const redirectCache = createRedirectCache(redis, { ttlSeconds });

  return {
    resolveRedirect: createResolveRedirect({
      ...redirectCache,
      findRedirectBySlug,
    }),
  };
}
