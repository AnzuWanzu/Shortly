import type { RedirectLink } from '../shared/link-types';
import { LinkNotFoundError } from '../shared/link-errors';
import { redirectSlugSchema } from './redirect-schema';

type RedirectDependencies = {
  findRedirectBySlug: (slug: string) => Promise<RedirectLink | null>;
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

    const link = await dependencies.findRedirectBySlug(parsedSlug.data);
    if (!link) {
      throw new LinkNotFoundError();
    }

    return link.originalUrl;
  };
}
