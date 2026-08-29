import { Router, type Request, type Response } from 'express';
import { UnauthenticatedError } from '../auth/auth-errors';
import {
  readSessionCookie,
  requireCsrfHeader,
} from '../auth/session/session-router';
import type { AuthenticateSession } from '../auth/session/session-service';
import { LinkNotFoundError } from './link-errors';
import { createLinkSchema, linkIdSchema } from './link-schema';
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

export function createLinkRouter(dependencies: LinkRouterDependencies) {
  const router = Router();

  router.post('/', requireCsrfHeader, async (request, response) => {
    try {
      const user = await authenticateRequest(request, dependencies);
      const parsedInput = createLinkSchema.safeParse(request.body);

      if (!parsedInput.success) {
        response.status(400).json({
          error: {
            code: 'INVALID_LINK_INPUT',
            message: 'Link data is invalid',
            issues: parsedInput.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const link = await dependencies.createOwnedLink({
        ...parsedInput.data,
        userId: user.id,
      });
      response.status(201).json({ link });
    } catch (error) {
      sendLinkError(response, error, 'Unable to create link');
    }
  });

  router.get('/', async (request, response) => {
    try {
      const user = await authenticateRequest(request, dependencies);
      const links = await dependencies.listOwnedLinks(user.id);
      response.status(200).json({ links });
    } catch (error) {
      sendLinkError(response, error, 'Unable to list links');
    }
  });

  router.delete('/:id', requireCsrfHeader, async (request, response) => {
    try {
      const user = await authenticateRequest(request, dependencies);
      const parsedLinkId = linkIdSchema.safeParse(request.params['id']);

      if (!parsedLinkId.success) {
        throw new LinkNotFoundError();
      }

      await dependencies.deleteOwnedLink({
        linkId: parsedLinkId.data,
        userId: user.id,
      });
      response.status(204).send();
    } catch (error) {
      sendLinkError(response, error, 'Unable to delete link');
    }
  });

  return router;
}

async function authenticateRequest(
  request: Request,
  dependencies: Pick<LinkRouterDependencies, 'authenticateSession'>,
) {
  return dependencies.authenticateSession(readSessionCookie(request));
}

function sendLinkError(
  response: Response,
  error: unknown,
  internalMessage: string,
) {
  if (error instanceof UnauthenticatedError) {
    response.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof LinkNotFoundError) {
    response.status(404).json({
      error: {
        code: 'LINK_NOT_FOUND',
        message: error.message,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: internalMessage,
    },
  });
}
