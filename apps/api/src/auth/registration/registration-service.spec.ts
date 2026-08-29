import { vi } from 'vitest';
import { createRegisterUser } from './registration-service';

describe('registerUser', () => {
  it('passes a password hash to user creation', async () => {
    const input = {
      email: 'anzu@example.com',
      displayName: 'Anzu',
      password: 'i am not a chud',
    };

    const hashPassword = vi.fn(async () => {
      return 'stored-password-hash';
    });

    const createUser = vi.fn(async () => {
      return {
        id: 'user-123',
        email: input.email,
        displayName: input.displayName,
        createdAt: new Date('2026-08-28T00:00:00.000Z'),
      };
    });

    const registerUser = createRegisterUser({
      hashPassword,
      createUser,
    });

    await registerUser(input);

    expect(hashPassword).toHaveBeenCalledWith(input.password);

    expect(createUser).toHaveBeenCalledWith({
      email: input.email,
      displayName: input.displayName,
      passwordHash: 'stored-password-hash',
    });
  });
});
