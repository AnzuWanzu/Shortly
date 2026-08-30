import type { RedirectLink } from '../shared/link-types';
import { LinkNotFoundError } from '../shared/link-errors';
import { redirectSlugSchema } from './redirect-schema';

type RedirectDependencies = {
  findCachedDestination: (slug: string) => Promise<string | null>;
  findRedirectBySlug: (slug: string) => Promise<RedirectLink | null>;
  cacheDestination: (slug: string, destination: string) => Promise<void>;
};

export type ResolveRedirect = (slug: string) => Promise<string>;

export function createResolveRedirect(
  dependencies: RedirectDependencies,
): ResolveRedirect {
  return async function resolveRedirect(slug: string): Promise<string> {
    const parsedSlug = redirectSlugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      throw new LinkNotFoundError();
    }

    const cachedDestination = await dependencies.findCachedDestination(
      parsedSlug.data,
    );

    if (cachedDestination) {
      return cachedDestination;
    }

    const link = await dependencies.findRedirectBySlug(parsedSlug.data);
    if (!link) {
      throw new LinkNotFoundError();
    }

    await dependencies.cacheDestination(parsedSlug.data, link.originalUrl);

    return link.originalUrl;
  };
}
