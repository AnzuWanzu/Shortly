import { vi } from 'vitest';
import { LinkNotFoundError } from '../shared/link-errors';
import { createResolveRedirect } from './redirect-service';

describe('createResolveRedirect', () => {
  it('returns the stored destination for a known slug', async () => {
    const findCachedDestination = vi.fn(async () => null);
    const findRedirectBySlug = vi.fn(async () => ({
      originalUrl: 'https://example.com/articles/42',
    }));
    const cacheDestination = vi.fn(async () => undefined);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
      cacheDestination,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/articles/42',
    );
  });

  it('caches the PostgreSQL destination after a cache miss', async () => {
    const findCachedDestination = vi.fn(async () => null);
    const findRedirectBySlug = vi.fn(async () => ({
      originalUrl: 'https://example.com/from-postgresql',
    }));

    const cacheDestination = vi.fn(async () => undefined);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
      cacheDestination,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/from-postgresql',
    );

    expect(cacheDestination).toHaveBeenCalledWith(
      'abc123XY',
      'https://example.com/from-postgresql',
    );
  });

  it('returns a cached destination without querying PostgreSQL', async () => {
    const findCachedDestination = vi.fn(
      async () => 'https://example.com/from-cache',
    );
    const findRedirectBySlug = vi.fn(async () => {
      throw new Error('PostgreSQL should not run during a cache hit');
    });
    const cacheDestination = vi.fn(async () => undefined);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
      cacheDestination,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/from-cache',
    );

    expect(findCachedDestination).toHaveBeenCalledWith('abc123XY');
    expect(findRedirectBySlug).not.toHaveBeenCalled();
  });

  it('hides whether a missing or malformed slug ever existed', async () => {
    const findCachedDestination = vi.fn(async () => null);
    const findRedirectBySlug = vi.fn(async () => null);
    const cacheDestination = vi.fn(async () => undefined);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
      cacheDestination,
    });

    await expect(resolveRedirect('missing1')).rejects.toBeInstanceOf(
      LinkNotFoundError,
    );
  });

  it('falls back to PostgreSQL when the cache read fails', async () => {
    const findCachedDestination = vi.fn(async () => {
      throw new Error('Redis unavailable');
    });
    const findRedirectBySlug = vi.fn(async () => ({
      originalUrl: 'https://example.com/from-postgresql',
    }));
    const cacheDestination = vi.fn(async () => undefined);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
      cacheDestination,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/from-postgresql',
    );
  });
});
