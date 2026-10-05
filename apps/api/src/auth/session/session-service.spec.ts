import { vi } from 'vitest';
import { UnauthenticatedError } from '../shared/auth-errors';
import { createAuthenticateSession, createLogoutUser } from './session-service';

const user = {
  id: 'user-123',
  email: 'anzu@example.com',
  displayName: 'Anzu',
  createdAt: new Date('2026-08-28T00:00:00.000Z'),
};

const activeSession = {
  id: 'session-123',
  tokenHash: 'hashed-session-token',
  expiresAt: new Date('2026-09-04T10:00:00.000Z'),
  user,
};

function createDependencies() {
  return {
    hashSessionToken: vi.fn(() => 'hashed-session-token'),
    findSession: vi.fn(async () => activeSession),
    deleteSession: vi.fn(async () => undefined),
    now: vi.fn(() => new Date('2026-08-28T10:00:00.000Z')),
  };
}

describe('authenticateSession', () => {
  it('returns the safe user for an active session token', async () => {
    const dependencies = createDependencies();
    const authenticateSession = createAuthenticateSession(dependencies);

    await expect(authenticateSession('raw-session-token')).resolves.toEqual(
      user,
    );
    expect(dependencies.findSession).toHaveBeenCalledWith(
      'hashed-session-token',
    );
  });

  it('rejects a missing session token without querying the database', async () => {
    const dependencies = createDependencies();
    const authenticateSession = createAuthenticateSession(dependencies);

    await expect(authenticateSession(undefined)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(dependencies.findSession).not.toHaveBeenCalled();
  });

  it('deletes an expired session before rejecting it', async () => {
    const dependencies = createDependencies();
    dependencies.findSession.mockResolvedValue({
      ...activeSession,
      expiresAt: new Date('2026-08-28T09:59:59.999Z'),
    });
    const authenticateSession = createAuthenticateSession(dependencies);

    await expect(
      authenticateSession('raw-session-token'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(dependencies.deleteSession).toHaveBeenCalledWith(
      'hashed-session-token',
    );
  });
});

describe('logoutUser', () => {
  it('hashes the raw token and deletes its server-side session', async () => {
    const dependencies = createDependencies();
    const logoutUser = createLogoutUser(dependencies);

    await logoutUser('raw-session-token');

    expect(dependencies.deleteSession).toHaveBeenCalledWith(
      'hashed-session-token',
    );
  });

  it('is safely idempotent when no cookie exists', async () => {
    const dependencies = createDependencies();
    const logoutUser = createLogoutUser(dependencies);

    await expect(logoutUser(undefined)).resolves.toBeUndefined();
    expect(dependencies.deleteSession).not.toHaveBeenCalled();
  });
});
