import { vi } from 'vitest';
import { SlugAlreadyExistsError } from './link-errors';
import { createCreateOwnedLink } from './link-service';

describe('createOwnedLink', () => {
  it('assigns ownership from the authenticated user, not request data', async () => {
    const createdAt = new Date('2026-08-29T00:00:00.000Z');
    const createLinkRecord = vi.fn(async (input) => ({
      id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
      ...input,
      createdAt,
    }));
    const createSlug = vi.fn(() => 'abc123XY');
    const createOwnedLink = createCreateOwnedLink({
      createLinkRecord,
      createSlug,
      maxSlugAttempts: 3,
    });

    const result = await createOwnedLink({
      userId: 'user-123',
      originalUrl: 'https://example.com/long',
    });

    expect(createLinkRecord).toHaveBeenCalledWith({
      userId: 'user-123',
      originalUrl: 'https://example.com/long',
      slug: 'abc123XY',
    });
    expect(result.userId).toBe('user-123');
  });

  it('retries a rare generated-slug collision', async () => {
    const createLinkRecord = vi
      .fn()
      .mockRejectedValueOnce(new SlugAlreadyExistsError())
      .mockResolvedValueOnce({
        id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
        userId: 'user-123',
        originalUrl: 'https://example.com/long',
        slug: 'secondXY',
        createdAt: new Date('2026-08-29T00:00:00.000Z'),
      });
    const createSlug = vi
      .fn()
      .mockReturnValueOnce('first123')
      .mockReturnValueOnce('secondXY');
    const createOwnedLink = createCreateOwnedLink({
      createLinkRecord,
      createSlug,
      maxSlugAttempts: 3,
    });

    await expect(
      createOwnedLink({
        userId: 'user-123',
        originalUrl: 'https://example.com/long',
      }),
    ).resolves.toMatchObject({ slug: 'secondXY' });
    expect(createLinkRecord).toHaveBeenCalledTimes(2);
  });
});
