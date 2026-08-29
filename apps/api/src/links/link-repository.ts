import type {
  CreateLinkRecordInput,
  LinkRecord,
} from './management/link-service';
import { LinkNotFoundError, SlugAlreadyExistsError } from './link-errors';

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

type PrismaDeleteLinks = (args: {
  where: { id: string; userId: string };
}) => Promise<{ count: number }>;

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
  prismaDeleteLinks: PrismaDeleteLinks,
) {
  return async function deleteOwnedLink(input: {
    linkId: string;
    userId: string;
  }): Promise<void> {
    const result = await prismaDeleteLinks({
      where: { id: input.linkId, userId: input.userId },
    });

    if (result.count === 0) {
      throw new LinkNotFoundError();
    }
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
