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
import { createRedirectCache } from './links/redirect/redirect-cache';
import { composeEmailVerification } from './auth/verification/verification-composition';

const {
  PORT: port,
  WEB_ORIGIN: webOrigin,
  DATABASE_URL: databaseUrl,
  COOKIE_SECURE: secureCookies,
  REDIS_URL: redisUrl,
  REDIRECT_CACHE_TTL_SECONDS: redirectCacheTTLSeconds,
  SMTP_URL: smtpUrl,
  EMAIL_FROM: emailFrom,
  EMAIL_VERIFICATION_SECRET: emailVerificationSecret,
} = parseEnv(process.env);

const prisma = createPrismaClient(databaseUrl);
const redis = createRedisClient(redisUrl, (error) => {
  console.warn(`Redis client error: ${error.message}`);
});
void redis.connect().catch(() => undefined);
const redirectCache = createRedirectCache(redis, {
  ttlSeconds: redirectCacheTTLSeconds,
});
const checkDatabase = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
const verificationDependencies = composeEmailVerification(prisma, {
  smtpUrl,
  emailFrom,
  secret: emailVerificationSecret,
});
const authDependencies = {
  ...composeRegistration(prisma, verificationDependencies.issueVerification),
  ...composeLogin(prisma),
  ...composeSession(prisma),
};

const app = createApp({
  webOrigin,
  checkDatabase,
  ...authDependencies,
  secureCookies,
  profileDependencies: composeProfile(prisma),
  verificationDependencies,
  linkDependencies: composeLinks(prisma, redirectCache),
  redirectDependencies: composeRedirect(prisma, redirectCache),
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
