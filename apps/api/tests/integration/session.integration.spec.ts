import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../../src/auth/password-hasher';
import {
  SESSION_DURATION_MS,
  createLoginUser,
} from '../../src/auth/login-service';
import { createRegisterUser } from '../../src/auth/registration-service';
import {
  createCreateSessionRepository,
  createDeleteSessionRepository,
  createFindSessionRepository,
} from '../../src/auth/session-repository';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/auth/session-router';
import {
  createAuthenticateSession,
  createLogoutUser,
} from '../../src/auth/session-service';
import {
  createSessionToken,
  hashSessionToken,
} from '../../src/auth/session-token';
import {
  createFindUserByEmailRepository,
  createUserRepository,
} from '../../src/auth/user-repository';
import { createPrismaClient } from '../../src/database/prisma';

const databaseUrl = process.env['DATABASE_URL_TEST'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL_TEST is required for API integration tests');
}

const prisma = createPrismaClient(databaseUrl);
const createdEmails = new Set<string>();

afterEach(async () => {
  if (createdEmails.size === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: { email: { in: [...createdEmails] } },
  });
  createdEmails.clear();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('opaque session lifecycle', () => {
  it('persists login, authenticates the cookie, and revokes logout', async () => {
    const email = `session-${randomUUID()}@shortly.test`;
    const password = 'correct horse battery staple';
    createdEmails.add(email);

    const createUser = createUserRepository((args) => prisma.user.create(args));
    const registerUser = createRegisterUser({ hashPassword, createUser });
    const user = await registerUser({
      email,
      displayName: 'Session Anzu',
      password,
    });
    const findUserByEmail = createFindUserByEmailRepository((args) =>
      prisma.user.findUnique(args),
    );
    const createSession = createCreateSessionRepository((args) =>
      prisma.session.create(args),
    );
    const findSession = createFindSessionRepository((args) =>
      prisma.session.findUnique(args),
    );
    const deleteSession = createDeleteSessionRepository((args) =>
      prisma.session.deleteMany(args),
    );
    const loginUser = createLoginUser({
      findUserByEmail,
      verifyPassword,
      createSession,
      createSessionToken,
      hashSessionToken,
      now: () => new Date(),
      sessionDurationMs: SESSION_DURATION_MS,
      dummyPasswordHash: DUMMY_PASSWORD_HASH,
    });
    const sessionDependencies = {
      hashSessionToken,
      findSession,
      deleteSession,
      now: () => new Date(),
    };
    const app = createApp({
      webOrigin: 'http://localhost:4200',
      checkDatabase: async () => undefined,
      registerUser,
      loginUser,
      authenticateSession: createAuthenticateSession(sessionDependencies),
      logoutUser: createLogoutUser(sessionDependencies),
      secureCookies: false,
    });
    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/auth/login')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user).toMatchObject({ id: user.id, email });

    const storedSession = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(storedSession.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    const meResponse = await agent.get('/auth/me');
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user).toMatchObject({ id: user.id, email });

    const logoutResponse = await agent
      .post('/auth/logout')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
    expect(logoutResponse.status).toBe(204);
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);

    const afterLogoutResponse = await agent.get('/auth/me');
    expect(afterLogoutResponse.status).toBe(401);
  });
});
