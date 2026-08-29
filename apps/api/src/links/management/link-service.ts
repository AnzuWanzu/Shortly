import { SlugAlreadyExistsError } from '../shared/link-errors';
import type {
  CreateLinkRecordInput,
  CreateOwnedLinkInput,
  LinkRecord,
} from '../shared/link-types';

type CreateOwnedLinkDependencies = {
  createLinkRecord: (input: CreateLinkRecordInput) => Promise<LinkRecord>;
  createSlug: () => string;
  maxSlugAttempts: number;
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
