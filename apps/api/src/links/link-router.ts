import { Router } from 'express';
import type { AuthenticateSession } from '../auth/session-service';
import type { CreateOwnedLinkInput, LinkRecord } from './link-service';

export type CreateOwnedLink = (
  input: CreateOwnedLinkInput,
) => Promise<LinkRecord>;
export type ListOwnedLinks = (userId: string) => Promise<LinkRecord[]>;
export type DeleteOwnedLink = (input: {
  linkId: string;
  userId: string;
}) => Promise<void>;

type LinkRouterDependencies = {
  authenticateSession: AuthenticateSession;
  createOwnedLink: CreateOwnedLink;
  listOwnedLinks: ListOwnedLinks;
  deleteOwnedLink: DeleteOwnedLink;
};

export function createLinkRouter(_dependencies: LinkRouterDependencies) {
  const router = Router();

  router.post('/', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  router.get('/', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  router.delete('/:id', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  return router;
}
