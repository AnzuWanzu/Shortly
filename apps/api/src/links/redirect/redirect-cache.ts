type RedirectCacheClient = {
  get: (key: string) => Promise<string | null>;
};

type RedirectCache = {
  findCachedDestination: (slug: string) => Promise<string | null>;
};

export function createRedirectCache(
  client: RedirectCacheClient,
): RedirectCache {
  return {
    findCachedDestination(slug: string) {
      return client.get(`redirect:${slug}`);
    },
  };
}
