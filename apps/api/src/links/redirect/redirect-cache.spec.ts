import { vi } from 'vitest';
import { createRedirectCache } from './redirect-cache';

describe('createRedirectCache', () => {
  it('reads a destination using the namespaced redirect key', async () => {
    const get = vi.fn(async () => 'https://example.com/articles/42');

    const cache = createRedirectCache({ get });

    await expect(cache.findCachedDestination('abc123XY')).resolves.toBe(
      'https://example.com/articles/42',
    );

    expect(get).toHaveBeenCalledWith('redirect:abc123XY');
  });
});
