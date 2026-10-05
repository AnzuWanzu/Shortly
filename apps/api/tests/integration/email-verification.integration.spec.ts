import { randomUUID } from 'node:crypto';

import { createVerificationRepository } from '../../src/auth/verification/verification-repository';
import { createPrismaClient } from '../../src/database/prisma';

const databaseUrl = process.env['DATABASE_URL_TEST'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL_TEST is required for API integration tests');
}

const prisma = createPrismaClient(databaseUrl);
const repository = createVerificationRepository(prisma);
const createdEmails = new Set<string>();

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [...createdEmails] } },
  });
  createdEmails.clear();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('email verification persistence', () => {
  it('marks the user verified and consumes the challenge atomically', async () => {
    const email = `verification-${randomUUID()}@shortly.test`;
    createdEmails.add(email);
    const user = await prisma.user.create({
      data: {
        email,
        displayName: 'Verification Anzu',
        passwordHash: 'integration-placeholder-hash',
      },
    });
    const verifiedAt = new Date('2026-09-29T12:00:00.000Z');

    await repository.replaceCode({
      userId: user.id,
      codeDigest: 'a'.repeat(64),
      expiresAt: new Date('2026-09-29T12:10:00.000Z'),
      lastSentAt: new Date('2026-09-29T12:00:00.000Z'),
    });
    await repository.consumeCodeAndVerifyUser(user.id, verifiedAt);

    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { emailVerifiedAt: true },
      }),
    ).resolves.toEqual({ emailVerifiedAt: verifiedAt });
    await expect(
      prisma.emailVerificationCode.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });
});
