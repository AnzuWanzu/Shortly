import { vi } from 'vitest';
import {
  LinkNotFoundError,
  SlugAlreadyExistsError,
} from './shared/link-errors';
import {
  createLinkRecordRepository,
  createListOwnedLinksRepository,
  createDeleteOwnedLinkRepository,
} from './link-repository';

describe('link repositories', () => {
  it('creates a link with the authenticated owner ID', async () => {
    const created = {
      id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
      slug: 'abc123XY',
      originalUrl: 'https://example.com/long',
      userId: 'user-123',
      createdAt: new Date('2026-08-29T00:00:00.000Z'),
    };
    const prismaCreateLink = vi.fn(async () => created);
    const createLinkRecord = createLinkRecordRepository(prismaCreateLink);

    await expect(
      createLinkRecord({
        slug: created.slug,
        originalUrl: created.originalUrl,
        userId: created.userId,
      }),
    ).resolves.toEqual(created);
    expect(prismaCreateLink).toHaveBeenCalledWith({
      data: {
        slug: created.slug,
        originalUrl: created.originalUrl,
        userId: created.userId,
      },
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        userId: true,
        createdAt: true,
      },
    });
  });

  it('translates a unique slug collision', async () => {
    const prismaCreateLink = vi.fn(async () => {
      throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    });
    const createLinkRecord = createLinkRecordRepository(prismaCreateLink);

    await expect(
      createLinkRecord({
        slug: 'abc123XY',
        originalUrl: 'https://example.com/long',
        userId: 'user-123',
      }),
    ).rejects.toBeInstanceOf(SlugAlreadyExistsError);
  });

  it('lists only links belonging to the authenticated user', async () => {
    const prismaFindLinks = vi.fn(async () => []);
    const listOwnedLinks = createListOwnedLinksRepository(prismaFindLinks);

    await listOwnedLinks('user-123');

    expect(prismaFindLinks).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        userId: true,
        createdAt: true,
      },
    });
  });

  it('deletes only when both the link and authenticated owner match', async () => {
    const prismaDeleteLinks = vi.fn(async () => ({ count: 1 }));
    const deleteOwnedLink = createDeleteOwnedLinkRepository(prismaDeleteLinks);

    await deleteOwnedLink({
      linkId: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
      userId: 'user-123',
    });

    expect(prismaDeleteLinks).toHaveBeenCalledWith({
      where: {
        id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
        userId: 'user-123',
      },
    });
  });

  it('returns the same not-found error for missing and cross-user links', async () => {
    const prismaDeleteLinks = vi.fn(async () => ({ count: 0 }));
    const deleteOwnedLink = createDeleteOwnedLinkRepository(prismaDeleteLinks);

    await expect(
      deleteOwnedLink({
        linkId: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
        userId: 'different-user',
      }),
    ).rejects.toBeInstanceOf(LinkNotFoundError);
  });
});
