import { createApp } from './app';
import { composeLogin } from './auth/login-composition';
import { composeRegistration } from './auth/registration-composition';
import { composeSession } from './auth/session-composition';
import { parseEnv } from './config/env';
import { createPrismaClient } from './database/prisma';
import { composeLinks } from './links/link-composition';

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
const authDependencies = {
  ...composeRegistration(prisma),
  ...composeLogin(prisma),
  ...composeSession(prisma),
};

const app = createApp({
  webOrigin,
  checkDatabase,
  ...authDependencies,
  secureCookies,
  linkDependencies: composeLinks(prisma),
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
