import type { CreateLinkRecordInput, LinkRecord } from './link-service';

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

export function createLinkRecordRepository(
  _prismaCreateLink: PrismaCreateLink,
) {
  return async function createLinkRecord(
    _input: CreateLinkRecordInput,
  ): Promise<LinkRecord> {
    throw new Error('Not implemented');
  };
}

export function createListOwnedLinksRepository(
  _prismaFindLinks: PrismaFindLinks,
) {
  return async function listOwnedLinks(_userId: string): Promise<LinkRecord[]> {
    throw new Error('Not implemented');
  };
}

export function createDeleteOwnedLinkRepository(
  _prismaDeleteLinks: PrismaDeleteLinks,
) {
  return async function deleteOwnedLink(_input: {
    linkId: string;
    userId: string;
  }): Promise<void> {
    throw new Error('Not implemented');
  };
}
