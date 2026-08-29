import { vi } from 'vitest';
import { InvalidCredentialsError } from '../shared/auth-errors';
import { createLoginUser } from './login-service';

const input = {
  email: 'anzu@example.com',
  password: 'correct horse battery staple',
};

const storedUser = {
  id: 'user-123',
  email: input.email,
  displayName: 'Anzu',
  passwordHash: 'stored-password-hash',
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
};

function createDependencies() {
  return {
    findUserByEmail: vi.fn(async () => storedUser),
    verifyPassword: vi.fn(async () => true),
    createSession: vi.fn(async () => undefined),
    createSessionToken: vi.fn(() => 'raw-session-token'),
    hashSessionToken: vi.fn(() => 'hashed-session-token'),
    now: vi.fn(() => new Date('2026-08-28T10:00:00.000Z')),
    sessionDurationMs: 7 * 24 * 60 * 60 * 1000,
    dummyPasswordHash: 'dummy-password-hash',
  };
}

describe('loginUser', () => {
  it('verifies the password and stores only a hash of the session token', async () => {
    const dependencies = createDependencies();
    const loginUser = createLoginUser(dependencies);

    const result = await loginUser(input);

    expect(dependencies.verifyPassword).toHaveBeenCalledWith(
      storedUser.passwordHash,
      input.password,
    );
    expect(dependencies.createSession).toHaveBeenCalledWith({
      userId: storedUser.id,
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-09-04T10:00:00.000Z'),
    });
    expect(result).toEqual({
      user: {
        id: storedUser.id,
        email: storedUser.email,
        displayName: storedUser.displayName,
        createdAt: storedUser.createdAt,
      },
      token: 'raw-session-token',
      expiresAt: new Date('2026-09-04T10:00:00.000Z'),
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('returns the same generic error for a wrong password', async () => {
    const dependencies = createDependencies();
    dependencies.verifyPassword.mockResolvedValue(false);
    const loginUser = createLoginUser(dependencies);

    await expect(loginUser(input)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(dependencies.createSession).not.toHaveBeenCalled();
  });

  it('still performs a dummy verification when the email is unknown', async () => {
    const dependencies = createDependencies();
    dependencies.findUserByEmail.mockResolvedValue(null);
    dependencies.verifyPassword.mockResolvedValue(false);
    const loginUser = createLoginUser(dependencies);

    await expect(loginUser(input)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(dependencies.verifyPassword).toHaveBeenCalledWith(
      dependencies.dummyPasswordHash,
      input.password,
    );
    expect(dependencies.createSession).not.toHaveBeenCalled();
  });
});
