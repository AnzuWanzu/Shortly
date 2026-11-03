import { SlugAlreadyExistsError } from '../shared/link-errors';
import type {
  CreateLinkRecordInput,
  CreateOwnedLinkInput,
  DeletedLink,
  LinkRecord,
} from '../shared/link-types';

type CreateOwnedLinkDependencies = {
  createLinkRecord: (input: CreateLinkRecordInput) => Promise<LinkRecord>;
  createSlug: () => string;
  maxSlugAttempts: number;
};

type DeleteOwnedLinkInput = {
  linkId: string;
  userId: string;
};

type DeleteOwnedLinkDependencies = {
  deleteLinkRecord: (input: DeleteOwnedLinkInput) => Promise<DeletedLink>;
  deleteCachedDestination: (slug: string) => Promise<void>;
};

export function createCreateOwnedLink(
  dependencies: CreateOwnedLinkDependencies,
) {
  return async function createOwnedLink(
    input: CreateOwnedLinkInput,
  ): Promise<LinkRecord> {
    for (let attempt = 1; attempt <= dependencies.maxSlugAttempts; attempt++) {
      try {
        return await dependencies.createLinkRecord({
          userId: input.userId,
          originalUrl: input.originalUrl,
          slug: dependencies.createSlug(),
        });
      } catch (error) {
        const canRetry =
          error instanceof SlugAlreadyExistsError &&
          attempt < dependencies.maxSlugAttempts;

        if (canRetry) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Unable to generate a unique slug');
  };
}

export function createDeleteOwnedLink(
  dependencies: DeleteOwnedLinkDependencies,
) {
  return async function deleteOwnedLink(input: DeleteOwnedLinkInput) {
    const deletedLink = await dependencies.deleteLinkRecord(input);

    try {
      await dependencies.deleteCachedDestination(deletedLink.slug);
    } catch {
      // PostgreSQL is authoritative; a Redis outage must not undo the deletion.
    }
  };
}
