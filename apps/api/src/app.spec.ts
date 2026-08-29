import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from './app';
import type { RegisterUser } from './auth/registration/registration-router';
import type { LoginUser } from './auth/login/login-service';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SESSION_COOKIE_NAME,
} from './auth/session-router';
import type { AuthenticateSession, LogoutUser } from './auth/session-service';

const webOrigin = 'http://localhost:4200';
const alwaysAvailableDatabase = async () => undefined;
const unusedRegisterUser: RegisterUser = async () => {
  throw new Error('Registration was not expected in this test');
};
const unusedLoginUser: LoginUser = async () => {
  throw new Error('Login was not expected in this test');
};
const unusedAuthenticateSession: AuthenticateSession = async () => {
  throw new Error('Authentication was not expected in this test');
};
const unusedLogoutUser: LogoutUser = async () => {
  throw new Error('Logout was not expected in this test');
};
const unusedSessionDependencies = {
  loginUser: unusedLoginUser,
  authenticateSession: unusedAuthenticateSession,
  logoutUser: unusedLogoutUser,
  secureCookies: false,
};
const app = createApp({
  webOrigin,
  checkDatabase: alwaysAvailableDatabase,
  registerUser: unusedRegisterUser,
  ...unusedSessionDependencies,
});

describe('GET /health', () => {
  it('returns the service health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('allows the configured web origin', async () => {
    const response = await request(app).get('/health').set('Origin', webOrigin);

    expect(response.headers['access-control-allow-origin']).toBe(webOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not grant browser access to another origin', async () => {
    const untrustedOrigin = 'https://evil.example';

    const response = await request(app)
      .get('/health')
      .set('Origin', untrustedOrigin);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).not.toBe(
      untrustedOrigin,
    );
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('security headers', () => {
  it('does not advertise Express', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('prevents content-type sniffing', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('request body limits', () => {
  it('rejects JSON bodies larger than 10 KB', async () => {
    const oversizedBody = {
      content: 'x'.repeat(11 * 1024),
    };

    const response = await request(app).post('/health').send(oversizedBody);

    expect(response.status).toBe(413);
  });
});

describe('GET /ready', () => {
  it('returns ready when the database check succeeds', async () => {
    const databaseAvailable = async () => undefined;

    const readyApp = createApp({
      webOrigin,
      checkDatabase: databaseAvailable,
      registerUser: unusedRegisterUser,
      ...unusedSessionDependencies,
    });

    const response = await request(readyApp).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ready' });
  });
  it('returns not ready when the database check fails', async () => {
    const databaseUnavailable = async () => {
      throw new Error('Database unavailable');
    };

    const unavailableApp = createApp({
      webOrigin,
      checkDatabase: databaseUnavailable,
      registerUser: unusedRegisterUser,
      ...unusedSessionDependencies,
    });

    const response = await request(unavailableApp).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'not_ready' });
  });
});

describe('authentication routes', () => {
  it('mounts user registration under /auth', async () => {
    const createdAt = new Date('2026-08-28T00:00:00.000Z');
    const registerUser = vi.fn<RegisterUser>(async (input) => ({
      id: 'user-123',
      email: input.email,
      displayName: input.displayName,
      createdAt,
    }));
    const registrationApp = createApp({
      webOrigin,
      checkDatabase: alwaysAvailableDatabase,
      registerUser,
      ...unusedSessionDependencies,
    });

    const response = await request(registrationApp)
      .post('/auth/register')
      .send({
        email: 'anzu@example.com',
        displayName: 'Anzu',
        password: 'correct horse battery staple',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        id: 'user-123',
        email: 'anzu@example.com',
        displayName: 'Anzu',
        createdAt: createdAt.toISOString(),
      },
    });
  });

  it('mounts login and session routes under /auth', async () => {
    const user = {
      id: 'user-123',
      email: 'anzu@example.com',
      displayName: 'Anzu',
      createdAt: new Date('2026-08-28T00:00:00.000Z'),
    };
    const loginUser = vi.fn<LoginUser>(async () => ({
      user,
      token: 'raw-session-token',
      expiresAt: new Date('2026-09-04T00:00:00.000Z'),
    }));
    const authenticateSession = vi.fn<AuthenticateSession>(async () => user);
    const logoutUser = vi.fn<LogoutUser>(async () => undefined);
    const sessionApp = createApp({
      webOrigin,
      checkDatabase: alwaysAvailableDatabase,
      registerUser: unusedRegisterUser,
      loginUser,
      authenticateSession,
      logoutUser,
      secureCookies: false,
    });

    const response = await request(sessionApp)
      .post('/auth/login')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ email: 'anzu@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  });
});

describe('owned link routes', () => {
  it('mounts authenticated link creation under /links', async () => {
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
    const createOwnedLink = vi.fn(async () => link);
    const linkAppConfig = {
      webOrigin,
      checkDatabase: alwaysAvailableDatabase,
      registerUser: unusedRegisterUser,
      loginUser: unusedLoginUser,
      authenticateSession: vi.fn<AuthenticateSession>(async () => user),
      logoutUser: unusedLogoutUser,
      secureCookies: false,
      linkDependencies: {
        createOwnedLink,
        listOwnedLinks: vi.fn(async () => [link]),
        deleteOwnedLink: vi.fn(async () => undefined),
      },
    };
    const linkApp = createApp(linkAppConfig);

    const response = await request(linkApp)
      .post('/links')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`)
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ originalUrl: link.originalUrl });

    expect(response.status).toBe(201);
    expect(createOwnedLink).toHaveBeenCalledWith({
      userId: user.id,
      originalUrl: link.originalUrl,
    });
  });
});
