import { vi } from 'vitest';
import { createUserRepository } from './user-repository';

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
});
