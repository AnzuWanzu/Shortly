import { vi } from 'vitest';
import { LinkNotFoundError } from '../shared/link-errors';
import { createResolveRedirect } from './redirect-service';

describe('createResolveRedirect', () => {
  it('returns the stored destination for a known slug', async () => {
    const findRedirectBySlug = vi.fn(async () => ({
      originalUrl: 'https://example.com/articles/42',
    }));
    const resolveRedirect = createResolveRedirect({ findRedirectBySlug });

    await expect(resolveRedirect('abc123XY')).resolves.toBe(
      'https://example.com/articles/42',
    );
  });

  it('hides whether a missing or malformed slug ever existed', async () => {
    const findRedirectBySlug = vi.fn(async () => null);
    const resolveRedirect = createResolveRedirect({ findRedirectBySlug });

    await expect(resolveRedirect('missing1')).rejects.toBeInstanceOf(
      LinkNotFoundError,
    );
  });
});
