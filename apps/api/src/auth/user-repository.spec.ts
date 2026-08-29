import { vi } from 'vitest';
import { EmailAlreadyExistsError } from './shared/auth-errors';
import {
  createFindUserByEmailRepository,
  createUserRepository,
} from './user-repository';

describe('createUserRepository', () => {
  it('passes user data and a safe field selection to Prisma', async () => {
    const input = {
      email: 'anzu@example.com',
      displayName: 'Anzu',
      passwordHash: 'stored-password-hash',
    };

    const prismaCreateUser = vi.fn(async () => {
      return {
        id: 'user-123',
        email: input.email,
        displayName: input.displayName,
        createdAt: new Date('2026-08-28T00:00:00.000Z'),
      };
    });

    const createUser = createUserRepository(prismaCreateUser);

    await createUser(input);

    expect(prismaCreateUser).toHaveBeenCalledWith({
      data: input,
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  });

  it('translates a Prisma unique constraint into an email conflict', async () => {
    const prismaError = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
    });
    const prismaCreateUser = vi.fn(async () => {
      throw prismaError;
    });
    const createUser = createUserRepository(prismaCreateUser);

    await expect(
      createUser({
        email: 'anzu@example.com',
        displayName: 'Anzu',
        passwordHash: 'stored-password-hash',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });
});

describe('createFindUserByEmailRepository', () => {
  it('looks up a normalized email and deliberately selects the password hash', async () => {
    const storedUser = {
      id: 'user-123',
      email: 'anzu@example.com',
      displayName: 'Anzu',
      passwordHash: 'stored-password-hash',
      createdAt: new Date('2026-08-28T00:00:00.000Z'),
    };
    const prismaFindUser = vi.fn(async () => storedUser);
    const findUserByEmail = createFindUserByEmailRepository(prismaFindUser);

    await expect(findUserByEmail(storedUser.email)).resolves.toEqual(
      storedUser,
    );
    expect(prismaFindUser).toHaveBeenCalledWith({
      where: { email: storedUser.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        createdAt: true,
      },
    });
  });
});
