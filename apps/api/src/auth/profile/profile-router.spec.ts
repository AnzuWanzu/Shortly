import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { UnauthenticatedError } from '../shared/auth-errors';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SESSION_COOKIE_NAME,
} from '../session/session-router';
import type { AuthenticateSession } from '../session/session-service';
import { createProfileRouter } from './profile-router';
import type { UpdateProfile } from './profile-service';

const user = {
  id: 'user-123',
  email: 'anzu@example.com',
  displayName: 'Anzu',
  createdAt: new Date('2026-08-29T00:00:00.000Z'),
};

function createTestApp(
  authenticateSession: AuthenticateSession,
  updateProfile: UpdateProfile,
) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', createProfileRouter({ authenticateSession, updateProfile }));
  return app;
}

describe('PATCH /auth/me', () => {
  it('updates the authenticated user profile', async () => {
    const authenticateSession = vi.fn<AuthenticateSession>(async () => user);
    const updatedUser = { ...user, displayName: 'Anzu Prime' };
    const updateProfile = vi.fn<UpdateProfile>(async () => updatedUser);
    const app = createTestApp(authenticateSession, updateProfile);

    const response = await request(app)
      .patch('/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`)
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ displayName: '  Anzu Prime  ' });

    expect(response.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith({
      userId: user.id,
      displayName: 'Anzu Prime',
    });
    expect(response.body.user.displayName).toBe('Anzu Prime');
  });

  it('rejects a client-selected user ID', async () => {
    const updateProfile = vi.fn<UpdateProfile>();
    const app = createTestApp(async () => user, updateProfile);

    const response = await request(app)
      .patch('/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`)
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ displayName: 'Anzu Prime', userId: 'attacker-user' });

    expect(response.status).toBe(400);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('requires CSRF protection before changing a profile', async () => {
    const updateProfile = vi.fn<UpdateProfile>();
    const app = createTestApp(async () => user, updateProfile);
    const response = await request(app)
      .patch('/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=raw-session-token`)
      .send({ displayName: 'Anzu Prime' });

    expect(response.status).toBe(403);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('requires an authenticated session', async () => {
    const authenticateSession = vi.fn<AuthenticateSession>(async () => {
      throw new UnauthenticatedError();
    });
    const updateProfile = vi.fn<UpdateProfile>();
    const app = createTestApp(authenticateSession, updateProfile);
    const response = await request(app)
      .patch('/auth/me')
      .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE)
      .send({ displayName: 'Anzu Prime' });

    expect(response.status).toBe(401);
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
