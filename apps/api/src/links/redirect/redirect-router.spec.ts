import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { LinkNotFoundError } from '../shared/link-errors';
import { createRedirectRouter } from './redirect-router';
import type { ResolveRedirect } from './redirect-service';

function createTestApp(resolveRedirect: ResolveRedirect) {
  const app = express();
  app.use('/r', createRedirectRouter({ resolveRedirect }));
  return app;
}

describe('GET /r/:slug', () => {
  it('redirects a public visitor to the stored destination', async () => {
    const resolveRedirect = vi.fn<ResolveRedirect>(
      async () => 'https://example.com/articles/42',
    );
    const response = await request(createTestApp(resolveRedirect)).get(
      '/r/abc123XY',
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://example.com/articles/42');
    expect(resolveRedirect).toHaveBeenCalledWith('abc123XY');
  });

  it('returns the same 404 for unknown and malformed slugs', async () => {
    const resolveRedirect = vi.fn<ResolveRedirect>(async () => {
      throw new LinkNotFoundError();
    });
    const response = await request(createTestApp(resolveRedirect)).get(
      '/r/missing1',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'LINK_NOT_FOUND', message: 'Link not found' },
    });
  });
});
