/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { createApp } from './app';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from './auth/password-hasher';
import { SESSION_DURATION_MS, createLoginUser } from './auth/login-service';
import { createRegisterUser } from './auth/registration-service';
import {
  createCreateSessionRepository,
  createDeleteSessionRepository,
  createFindSessionRepository,
} from './auth/session-repository';
import {
  createAuthenticateSession,
  createLogoutUser,
} from './auth/session-service';
import { createSessionToken, hashSessionToken } from './auth/session-token';
import {
  createFindUserByEmailRepository,
  createUserRepository,
} from './auth/user-repository';
import { parseEnv } from './config/env';
import { createPrismaClient } from './database/prisma';

const {
  PORT: port,
  WEB_ORIGIN: webOrigin,
  DATABASE_URL: databaseUrl,
  COOKIE_SECURE: secureCookies,
} = parseEnv(process.env);

const prisma = createPrismaClient(databaseUrl);
const checkDatabase = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
const createUser = createUserRepository((args) => prisma.user.create(args));
const registerUser = createRegisterUser({ hashPassword, createUser });
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
const authenticateSession = createAuthenticateSession(sessionDependencies);
const logoutUser = createLogoutUser(sessionDependencies);

const app = createApp({
  webOrigin,
  checkDatabase,
  registerUser,
  loginUser,
  authenticateSession,
  logoutUser,
  secureCookies,
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
