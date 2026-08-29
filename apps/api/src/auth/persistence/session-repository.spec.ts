import { vi } from 'vitest';
import {
  createCreateSessionRepository,
  createDeleteSessionRepository,
  createFindSessionRepository,
} from './session-repository';

describe('session repositories', () => {
  it('creates a server-side session from a token hash', async () => {
    const prismaCreateSession = vi.fn(async () => ({ id: 'session-123' }));
    const createSession = createCreateSessionRepository(prismaCreateSession);
    const input = {
      userId: 'user-123',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-09-04T10:00:00.000Z'),
    };

    await createSession(input);

    expect(prismaCreateSession).toHaveBeenCalledWith({ data: input });
  });

  it('finds a session with only the safe user fields', async () => {
    const storedSession = {
      id: 'session-123',
      tokenHash: 'hashed-session-token',
      expiresAt: new Date('2026-09-04T10:00:00.000Z'),
      user: {
        id: 'user-123',
        email: 'anzu@example.com',
        displayName: 'Anzu',
        createdAt: new Date('2026-08-28T00:00:00.000Z'),
      },
    };
    const prismaFindSession = vi.fn(async () => storedSession);
    const findSession = createFindSessionRepository(prismaFindSession);

    await expect(findSession('hashed-session-token')).resolves.toEqual(
      storedSession,
    );
    expect(prismaFindSession).toHaveBeenCalledWith({
      where: { tokenHash: 'hashed-session-token' },
      select: {
        id: true,
        tokenHash: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            createdAt: true,
          },
        },
      },
    });
  });

  it('deletes every matching token hash without revealing whether it existed', async () => {
    const prismaDeleteSessions = vi.fn(async () => ({ count: 1 }));
    const deleteSession = createDeleteSessionRepository(prismaDeleteSessions);

    await deleteSession('hashed-session-token');

    expect(prismaDeleteSessions).toHaveBeenCalledWith({
      where: { tokenHash: 'hashed-session-token' },
    });
  });
});
