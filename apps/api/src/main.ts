import { createApp } from './app';
import { composeLogin } from './auth/login/login-composition';
import { composeRegistration } from './auth/registration/registration-composition';
import { composeSession } from './auth/session/session-composition';
import { composeProfile } from './auth/profile/profile-composition';
import { parseEnv } from './config/env';
import { createPrismaClient } from './database/prisma';
import { composeLinks } from './links/management/link-composition';
import { composeRedirect } from './links/redirect/redirect-composition';
import { createRedisClient } from './cache/redis';

const {
  PORT: port,
  WEB_ORIGIN: webOrigin,
  DATABASE_URL: databaseUrl,
  COOKIE_SECURE: secureCookies,
  REDIS_URL: redisUrl,
  REDIRECT_CACHE_TTL_SECONDS: redirectCacheTTLSeconds,
} = parseEnv(process.env);

const prisma = createPrismaClient(databaseUrl);
const redis = createRedisClient(redisUrl, (error) => {
  console.warn(`Redis client error: ${error.message}`);
});
void redis.connect().catch(() => undefined);
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
  profileDependencies: composeProfile(prisma),
  linkDependencies: composeLinks(prisma),
  redirectDependencies: composeRedirect(prisma, redis, redirectCacheTTLSeconds),
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
