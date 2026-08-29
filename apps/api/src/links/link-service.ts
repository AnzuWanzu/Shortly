import type { CreateLinkRequest } from './link-schema';

export type LinkRecord = {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
  createdAt: Date;
};

export type CreateLinkRecordInput = CreateLinkRequest & {
  slug: string;
  userId: string;
};

export type CreateOwnedLinkInput = CreateLinkRequest & {
  userId: string;
};

type CreateOwnedLinkDependencies = {
  createLinkRecord: (input: CreateLinkRecordInput) => Promise<LinkRecord>;
  createSlug: () => string;
  maxSlugAttempts: number;
};

export function createCreateOwnedLink(
  _dependencies: CreateOwnedLinkDependencies,
) {
  return async function createOwnedLink(
    _input: CreateOwnedLinkInput,
  ): Promise<LinkRecord> {
    throw new Error('Not implemented');
  };
}
