import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { InvalidCredentialsError, UnauthenticatedError } from './auth-errors';
import type { LoginUser } from './login-service';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SESSION_COOKIE_NAME,
  createSessionRouter,
} from './session-router';
import type { AuthenticateSession, LogoutUser } from './session-service';

const user = {
  id: 'user-123',
  email: 'anzu@example.com',
  displayName: 'Anzu',
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
};

function createDependencies(
  overrides: {
    loginUser?: LoginUser;
    authenticateSession?: AuthenticateSession;
    logoutUser?: LogoutUser;
    secureCookies?: boolean;
  } = {},
) {
  return {
    loginUser:
      overrides.loginUser ??
      vi.fn<LoginUser>(async () => ({
        user,
        token: 'raw-session-token',
        expiresAt: new Date('2026-09-04T10:00:00.000Z'),
      })),
    authenticateSession:
      overrides.authenticateSession ??
      vi.fn<AuthenticateSession>(async () => user),
    logoutUser:
      overrides.logoutUser ?? vi.fn<LogoutUser>(async () => undefined),
    secureCookies: overrides.secureCookies ?? false,
  };
}

function createTestApp(dependencies: ReturnType<typeof createDependencies>) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', createSessionRouter(dependencies));
  return app;
}

describe('POST /auth/login', () => {
  it('sets a hardened session cookie and returns the safe user', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await request(app)
      .post('/auth/login')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ email: '  ANZU@Example.COM ', password: 'password' });

    expect(response.status).toBe(200);
    expect(dependencies.loginUser).toHaveBeenCalledWith({
      email: 'anzu@example.com',
      password: 'password',
    });
    expect(response.body).toEqual({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
    expect(response.headers['set-cookie'][0]).toContain(
      `${SESSION_COOKIE_NAME}=raw-session-token`,
    );
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.headers['set-cookie'][0]).toContain('Path=/');
    expect(response.headers['set-cookie'][0]).not.toContain('Secure');
  });

  it('uses the same unauthorized response for invalid credentials', async () => {
    const loginUser = vi.fn<LoginUser>(async () => {
      throw new InvalidCredentialsError();
    });
    const app = createTestApp(createDependencies({ loginUser }));

    const response = await request(app)
      .post('/auth/login')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ email: 'anzu@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      },
    });
  });

  it('rejects a state-changing request without the CSRF header', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'anzu@example.com', password: 'password' });

    expect(response.status).toBe(403);
    expect(dependencies.loginUser).not.toHaveBeenCalled();
  });

  it('adds Secure to the cookie only when deployment configuration enables it', async () => {
    const app = createTestApp(createDependencies({ secureCookies: true }));

    const response = await request(app)
      .post('/auth/login')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ email: 'anzu@example.com', password: 'password' });

    expect(response.headers['set-cookie'][0]).toContain('Secure');
  });
});

describe('GET /auth/me', () => {
  it('returns the user represented by the session cookie', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`);

    expect(response.status).toBe(200);
    expect(dependencies.authenticateSession).toHaveBeenCalledWith(
      'raw-session-token',
    );
    expect(response.body).toEqual({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  });

  it('returns unauthorized for a missing or invalid session', async () => {
    const authenticateSession = vi.fn<AuthenticateSession>(async () => {
      throw new UnauthenticatedError();
    });
    const app = createTestApp(createDependencies({ authenticateSession }));

    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required',
      },
    });
  });
});

describe('POST /auth/logout', () => {
  it('revokes the server session, clears the cookie, and returns no content', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await request(app)
      .post('/auth/logout')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`);

    expect(response.status).toBe(204);
    expect(dependencies.logoutUser).toHaveBeenCalledWith('raw-session-token');
    expect(response.headers['set-cookie'][0]).toContain(
      `${SESSION_COOKIE_NAME}=;`,
    );
  });

  it('rejects logout without the CSRF header', async () => {
    const dependencies = createDependencies();
    const app = createTestApp(dependencies);

    const response = await request(app)
      .post('/auth/logout')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`);

    expect(response.status).toBe(403);
    expect(dependencies.logoutUser).not.toHaveBeenCalled();
  });
});
