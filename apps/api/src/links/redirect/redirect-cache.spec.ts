import { vi } from 'vitest';
import { createRedirectCache } from './redirect-cache';

describe('createRedirectCache', () => {
  it('reads a destination using the namespaced redirect key', async () => {
    const get = vi.fn(async () => 'https://example.com/articles/42');
    const set = vi.fn(async () => 'OK');

    const cache = createRedirectCache({ get, set }, { ttlSeconds: 300 });

    await expect(cache.findCachedDestination('abc123XY')).resolves.toBe(
      'https://example.com/articles/42',
    );

    expect(get).toHaveBeenCalledWith('redirect:abc123XY');
  });

  it('writes a destination with the configured TTL', async () => {
    const get = vi.fn(async () => null);
    const set = vi.fn(async () => 'OK');

    const cache = createRedirectCache({ get, set }, { ttlSeconds: 300 });

    await cache.cacheDestination('abc123XY', 'https://example.com/articles/42');

    expect(set).toHaveBeenCalledWith(
      'redirect:abc123XY',
      'https://example.com/articles/42',
      { EX: 300 },
    );
  });
});
