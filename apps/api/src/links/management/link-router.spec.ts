import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { UnauthenticatedError } from '../../auth/shared/auth-errors';
import type { AuthenticateSession } from '../../auth/session/session-service';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SESSION_COOKIE_NAME,
} from '../../auth/session/session-router';
import { LinkNotFoundError } from '../link-errors';
import {
  createLinkRouter,
  type CreateOwnedLink,
  type DeleteOwnedLink,
  type ListOwnedLinks,
} from './link-router';

const user = {
  id: 'user-123',
  email: 'anzu@example.com',
  displayName: 'Anzu',
  createdAt: new Date('2026-08-29T00:00:00.000Z'),
};

const link = {
  id: '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
  slug: 'abc123XY',
  originalUrl: 'https://example.com/long',
  userId: user.id,
  createdAt: new Date('2026-08-29T01:00:00.000Z'),
};

function createDependencies(
  overrides: {
    authenticateSession?: AuthenticateSession;
    createOwnedLink?: CreateOwnedLink;
    listOwnedLinks?: ListOwnedLinks;
    deleteOwnedLink?: DeleteOwnedLink;
  } = {},
) {
  return {
    authenticateSession:
      overrides.authenticateSession ??
      vi.fn<AuthenticateSession>(async () => user),
    createOwnedLink:
      overrides.createOwnedLink ?? vi.fn<CreateOwnedLink>(async () => link),
    listOwnedLinks:
      overrides.listOwnedLinks ?? vi.fn<ListOwnedLinks>(async () => [link]),
    deleteOwnedLink:
      overrides.deleteOwnedLink ??
      vi.fn<DeleteOwnedLink>(async () => undefined),
  };
}

function createTestApp(dependencies: ReturnType<typeof createDependencies>) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/links', createLinkRouter(dependencies));
  return app;
}

function authenticated(requestBuilder: request.Test) {
  return requestBuilder.set(
    'Cookie',
    `${SESSION_COOKIE_NAME}=raw-session-token`,
  );
}

describe('POST /links', () => {
  it('creates a link owned by the authenticated user', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await authenticated(request(app).post('/links'))
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ originalUrl: link.originalUrl });

    expect(response.status).toBe(201);
    expect(dependencies.createOwnedLink).toHaveBeenCalledWith({
      userId: user.id,
      originalUrl: link.originalUrl,
    });
    expect(response.body).toEqual({
      link: { ...link, createdAt: link.createdAt.toISOString() },
    });
  });

  it('rejects a client-selected owner before calling the service', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await authenticated(request(app).post('/links'))
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ originalUrl: link.originalUrl, userId: 'attacker-user' });

    expect(response.status).toBe(400);
    expect(dependencies.createOwnedLink).not.toHaveBeenCalled();
  });

  it('requires the CSRF header before changing data', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await authenticated(request(app).post('/links')).send({
      originalUrl: link.originalUrl,
    });

    expect(response.status).toBe(403);
    expect(dependencies.createOwnedLink).not.toHaveBeenCalled();
  });
});

describe('GET /links', () => {
  it('lists only links for the authenticated user', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await authenticated(request(app).get('/links'));

    expect(response.status).toBe(200);
    expect(dependencies.listOwnedLinks).toHaveBeenCalledWith(user.id);
    expect(response.body).toEqual({
      links: [{ ...link, createdAt: link.createdAt.toISOString() }],
    });
  });

  it('requires an authenticated session', async () => {
    const authenticateSession = vi.fn<AuthenticateSession>(async () => {
      throw new UnauthenticatedError();
    });
    const dependencies = createDependencies({ authenticateSession });
    const app = createTestApp(dependencies);

    const response = await request(app).get('/links');

    expect(response.status).toBe(401);
    expect(dependencies.listOwnedLinks).not.toHaveBeenCalled();
  });
});

describe('DELETE /links/:id', () => {
  it('returns not found when the link does not belong to the user', async () => {
    const deleteOwnedLink = vi.fn<DeleteOwnedLink>(async () => {
      throw new LinkNotFoundError();
    });
    const app = createTestApp(createDependencies({ deleteOwnedLink }));

    const response = await authenticated(
      request(app).delete(`/links/${link.id}`),
    ).set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'LINK_NOT_FOUND', message: 'Link not found' },
    });
  });

  it('deletes an owned link without returning a body', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await authenticated(
      request(app).delete(`/links/${link.id}`),
    ).set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);

    expect(response.status).toBe(204);
    expect(dependencies.deleteOwnedLink).toHaveBeenCalledWith({
      linkId: link.id,
      userId: user.id,
    });
  });
});
