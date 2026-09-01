type RedirectCacheClient = {
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options: { EX: number },
  ) => Promise<unknown>;
};

type RedirectCacheConfig = {
  ttlSeconds: number;
};

type RedirectCache = {
  findCachedDestination: (slug: string) => Promise<string | null>;
  cacheDestination: (slug: string, destination: string) => Promise<void>;
};

export function createRedirectCache(
  client: RedirectCacheClient,
  config: RedirectCacheConfig,
): RedirectCache {
  return {
    findCachedDestination(slug: string) {
      return client.get(`redirect:${slug}`);
    },

    async cacheDestination(slug: string, destination: string) {
      await client.set(`redirect:${slug}`, destination, {
        EX: config.ttlSeconds,
      });
    },
  };
}
