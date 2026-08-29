import { randomUUID } from 'node:crypto';
import { EmailAlreadyExistsError } from '../../src/auth/shared/auth-errors';
import {
  hashPassword,
  verifyPassword,
} from '../../src/auth/shared/password-hasher';
import { createUserRepository } from '../../src/auth/persistence/user-repository';
import { createPrismaClient } from '../../src/database/prisma';

const databaseUrl = process.env['DATABASE_URL_TEST'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL_TEST is required for API integration tests');
}

const prisma = createPrismaClient(databaseUrl);
const createdEmails = new Set<string>();
const createUser = createUserRepository((args) => prisma.user.create(args));

afterEach(async () => {
  if (createdEmails.size === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      email: { in: [...createdEmails] },
    },
  });
  createdEmails.clear();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('registration persistence', () => {
  it('stores an Argon2 hash and returns only safe fields', async () => {
    const email = `registration-${randomUUID()}@shortly.test`;
    const password = 'correct horse battery staple';
    const passwordHash = await hashPassword(password);
    createdEmails.add(email);

    const createdUser = await createUser({
      email,
      displayName: 'Integration Anzu',
      passwordHash,
    });

    expect(createdUser).not.toHaveProperty('passwordHash');
    expect(createdUser).toMatchObject({
      email,
      displayName: 'Integration Anzu',
    });

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    expect(storedUser.passwordHash).not.toBe(password);
    await expect(
      verifyPassword(storedUser.passwordHash, password),
    ).resolves.toBe(true);
  });

  it('translates the real unique constraint into an email conflict', async () => {
    const email = `duplicate-${randomUUID()}@shortly.test`;
    const passwordHash = await hashPassword(
      'another correct horse battery staple',
    );
    createdEmails.add(email);

    const input = {
      email,
      displayName: 'Duplicate Anzu',
      passwordHash,
    };

    await createUser(input);

    await expect(createUser(input)).rejects.toBeInstanceOf(
      EmailAlreadyExistsError,
    );
  });
});
