import 'dotenv/config';

import { createPrismaClient } from '../apps/api/src/database/prisma';
import {
  DEVELOPMENT_ACCOUNTS,
  seedDevelopmentAccounts,
} from '../apps/api/src/database/development-seed';
import { hashPassword } from '../apps/api/src/auth/shared/password-hasher';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = createPrismaClient(databaseUrl);

try {
  await seedDevelopmentAccounts(
    {
      allowDevelopmentSeed: process.env['ALLOW_DEVELOPMENT_SEED'],
      nodeEnv: process.env['NODE_ENV'],
      demoPassword: process.env['SEED_DEMO_PASSWORD'],
      pendingPassword: process.env['SEED_PENDING_PASSWORD'],
    },
    {
      hashPassword,
      upsertUser: async (input) => {
        await prisma.user.upsert({
          where: { email: input.email },
          update: input,
          create: input,
          select: { id: true },
        });
      },
    },
  );

  console.info(
    `Seeded ${DEVELOPMENT_ACCOUNTS.demo.email} (verified) and ${DEVELOPMENT_ACCOUNTS.pending.email} (pending verification).`,
  );
} finally {
  await prisma.$disconnect();
}
