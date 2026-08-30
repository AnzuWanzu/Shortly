import { vi } from 'vitest';
import { LinkNotFoundError } from '../shared/link-errors';
import { createResolveRedirect } from './redirect-service';

describe('createResolveRedirect', () => {
  it('returns the stored destination for a known slug', async () => {
    const findCachedDestination = vi.fn(async () => null);
    const findRedirectBySlug = vi.fn(async () => ({
      originalUrl: 'https://example.com/articles/42',
    }));

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/articles/42',
    );
  });

  it('hides whether a missing or malformed slug ever existed', async () => {
    const findCachedDestination = vi.fn(async () => null);
    const findRedirectBySlug = vi.fn(async () => null);

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
    });

    await expect(resolveRedirect('missing1')).rejects.toBeInstanceOf(
      LinkNotFoundError,
    );
  });

  it('returns a cached destination without querying PostgreSQL', async () => {
    const findCachedDestination = vi.fn(
      async () => 'https://example.com/from-cache',
    );

    const findRedirectBySlug = vi.fn(async () => {
      throw new Error('PostgreSQL should not run during a cache hit');
    });

    const resolveRedirect = createResolveRedirect({
      findCachedDestination,
      findRedirectBySlug,
    });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/from-cache',
    );

    expect(findCachedDestination).toHaveBeenCalledWith('abc123XY');
    expect(findRedirectBySlug).not.toHaveBeenCalled();
  });
});
