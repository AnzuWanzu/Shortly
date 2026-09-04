import {
  LinkNotFoundError,
  SlugAlreadyExistsError,
} from '../shared/link-errors';
import type {
  CreateLinkRecordInput,
  DeletedLink,
  LinkRecord,
  RedirectLink,
} from '../shared/link-types';

const linkSelection = {
  id: true,
  slug: true,
  originalUrl: true,
  userId: true,
  createdAt: true,
} as const;

type PrismaCreateLink = (args: {
  data: CreateLinkRecordInput;
  select: typeof linkSelection;
}) => Promise<LinkRecord>;

type PrismaFindLinks = (args: {
  where: { userId: string };
  orderBy: { createdAt: 'desc' };
  select: typeof linkSelection;
}) => Promise<LinkRecord[]>;

type PrismaDeleteLink = (args: {
  where: { id: string; userId: string };
  select: { slug: true };
}) => Promise<DeletedLink>;

type PrismaFindRedirect = (args: {
  where: { slug: string };
  select: { originalUrl: true };
}) => Promise<RedirectLink | null>;

export function createLinkRecordRepository(prismaCreateLink: PrismaCreateLink) {
  return async function createLinkRecord(
    input: CreateLinkRecordInput,
  ): Promise<LinkRecord> {
    try {
      return await prismaCreateLink({ data: input, select: linkSelection });
    } catch (error) {
      if (isErrorWithCode(error, 'P2002')) {
        throw new SlugAlreadyExistsError();
      }

      throw error;
    }
  };
}

export function createListOwnedLinksRepository(
  prismaFindLinks: PrismaFindLinks,
) {
  return async function listOwnedLinks(userId: string): Promise<LinkRecord[]> {
    return prismaFindLinks({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: linkSelection,
    });
  };
}

export function createDeleteOwnedLinkRepository(
  prismaDeleteLink: PrismaDeleteLink,
) {
  return async function deleteOwnedLink(input: {
    linkId: string;
    userId: string;
  }): Promise<DeletedLink> {
    try {
      return await prismaDeleteLink({
        where: { id: input.linkId, userId: input.userId },
        select: { slug: true },
      });
    } catch (error) {
      if (isErrorWithCode(error, 'P2025')) {
        throw new LinkNotFoundError();
      }

      throw error;
    }
  };
}

export function createFindRedirectBySlugRepository(
  prismaFindRedirect: PrismaFindRedirect,
) {
  return async function findRedirectBySlug(
    slug: string,
  ): Promise<RedirectLink | null> {
    return prismaFindRedirect({
      where: { slug },
      select: { originalUrl: true },
    });
  };
}

function isErrorWithCode(
  error: unknown,
  expectedCode: string,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === expectedCode
  );
}
