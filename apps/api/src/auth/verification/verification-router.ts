import { Router } from 'express';

export function createVerificationRouter(_dependencies: unknown) {
  const router = Router();

  router.post('/verify-email', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });
  router.post('/resend-verification', (_request, response) => {
    response.status(501).json({ error: { code: 'NOT_IMPLEMENTED' } });
  });

  return router;
}
