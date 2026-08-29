import { Router } from 'express';
import type { ResolveRedirect } from './redirect-service';

type RedirectRouterDependencies = {
  resolveRedirect: ResolveRedirect;
};

export function createRedirectRouter(
  _dependencies: RedirectRouterDependencies,
) {
  const router = Router();

  router.get('/:slug', (_request, response) => {
    response.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' },
    });
  });

  return router;
}
