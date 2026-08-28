/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import { createApp } from './app';
import { parseEnv } from './config/env';
import { createPrismaClient } from './database/prisma';

const {
  PORT: port,
  WEB_ORIGIN: webOrigin,
  DATABASE_URL: databaseUrl,
} = parseEnv(process.env);

const prisma = createPrismaClient(databaseUrl);
const checkDatabase = async () => {
  await prisma.$queryRaw`SELECT 1`;
};

const app = createApp({ webOrigin, checkDatabase });

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
