import { Router } from 'express';
import { LinkNotFoundError } from '../shared/link-errors';
import type { ResolveRedirect } from './redirect-service';

type RedirectRouterDependencies = {
  resolveRedirect: ResolveRedirect;
};

export function createRedirectRouter(dependencies: RedirectRouterDependencies) {
  const router = Router();

  router.get('/:slug', async (request, response) => {
    try {
      const destination = await dependencies.resolveRedirect(
        request.params['slug'] ?? '',
      );
      response.redirect(302, destination);
    } catch (error) {
      if (error instanceof LinkNotFoundError) {
        response.status(404).json({
          error: { code: 'LINK_NOT_FOUND', message: error.message },
        });
        return;
      }

      response.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unable to redirect link',
        },
      });
    }
  });

  return router;
}
