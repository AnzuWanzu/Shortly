import type { RedirectLink } from '../shared/link-types';

type RedirectDependencies = {
  findRedirectBySlug: (slug: string) => Promise<RedirectLink | null>;
};

export type ResolveRedirect = (slug: string) => Promise<string>;

export function createResolveRedirect(
  _dependencies: RedirectDependencies,
): ResolveRedirect {
  return async function resolveRedirect(_slug: string): Promise<string> {
    throw new Error('Not implemented');
  };
}
