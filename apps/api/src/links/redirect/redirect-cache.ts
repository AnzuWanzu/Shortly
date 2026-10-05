type RedirectCacheClient = {
  get: (key: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: string,
    options: { EX: number },
  ) => Promise<unknown>;
};

type RedirectCacheConfig = {
  ttlSeconds: number;
};

export type RedirectCache = {
  findCachedDestination: (slug: string) => Promise<string | null>;
  cacheDestination: (slug: string, destination: string) => Promise<void>;
  deleteCachedDestination: (slug: string) => Promise<void>;
};

export function createRedirectCache(
  client: RedirectCacheClient,
  config: RedirectCacheConfig,
): RedirectCache {
  return {
    async findCachedDestination(slug: string) {
      const destination = await client.get(`redirect:${slug}`);

      return typeof destination === 'string' ? destination : null;
    },

    async cacheDestination(slug: string, destination: string) {
      await client.set(`redirect:${slug}`, destination, {
        EX: config.ttlSeconds,
      });
    },

    async deleteCachedDestination(slug: string) {
      await client.del(`redirect:${slug}`);
    },
  };
}
