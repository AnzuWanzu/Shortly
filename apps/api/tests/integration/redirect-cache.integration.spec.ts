import { createRedisClient } from '../../src/cache/redis';
import { createRedirectCache } from '../../src/links/redirect/redirect-cache';
import { createSlug } from '../../src/links/management/slug';

const redisUrl = process.env['REDIS_URL_TEST'];

if (!redisUrl) {
  throw new Error('REDIS_URL_TEST is required for API integration tests');
}

const redis = createRedisClient(redisUrl, () => undefined);
const ttlSeconds = 300;
const redirectCache = createRedirectCache(redis, { ttlSeconds });
const createdSlugs = new Set<string>();

beforeAll(async () => {
  await redis.connect();
});

afterEach(async () => {
  await Promise.all(
    [...createdSlugs].map((slug) =>
      redirectCache.deleteCachedDestination(slug),
    ),
  );
  createdSlugs.clear();
});

afterAll(async () => {
  await redis.quit();
});

describe('redirect cache persistence', () => {
  it('stores a destination with an expiry and deletes it', async () => {
    const slug = createSlug();
    const destination = 'https://example.com/cached-destination';
    createdSlugs.add(slug);

    await redirectCache.cacheDestination(slug, destination);

    await expect(redirectCache.findCachedDestination(slug)).resolves.toBe(
      destination,
    );
    await expect(redis.ttl(`redirect:${slug}`)).resolves.toBeGreaterThan(0);
    await expect(redis.ttl(`redirect:${slug}`)).resolves.toBeLessThanOrEqual(
      ttlSeconds,
    );

    await redirectCache.deleteCachedDestination(slug);

    await expect(redirectCache.findCachedDestination(slug)).resolves.toBeNull();
  });
});
