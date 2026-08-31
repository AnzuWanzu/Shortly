type RedirectCacheClient = {
  get: (key: string) => Promise<string | null>;
};

type RedirectCache = {
  findCachedDestination: (slug: string) => Promise<string | null>;
};

export function createRedirectCache(
  _client: RedirectCacheClient,
): RedirectCache {
  throw new Error('Not implemented');
}
