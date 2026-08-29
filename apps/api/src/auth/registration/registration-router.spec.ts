import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { EmailAlreadyExistsError } from '../auth-errors';
import {
  createRegistrationRouter,
  type RegisterUser,
} from './registration-router';

const validRegistration = {
  email: '  ANZU@Example.COM ',
  displayName: '  Anzu  ',
  password: 'correct horse battery staple',
};

function createTestApp(registerUser: RegisterUser) {
  const app = express();

  app.use(express.json());
  app.use('/auth', createRegistrationRouter({ registerUser }));

  return app;
}

describe('POST /auth/register', () => {
  it('returns a safe created user for valid input', async () => {
    const createdAt = new Date('2026-08-28T00:00:00.000Z');
    const registerUser = vi.fn(async () => ({
      id: 'user-123',
      email: 'anzu@example.com',
      displayName: 'Anzu',
      createdAt,
    }));
    const app = createTestApp(registerUser);

    const response = await request(app)
      .post('/auth/register')
      .send(validRegistration);

    expect(response.status).toBe(201);
    expect(registerUser).toHaveBeenCalledWith({
      email: 'anzu@example.com',
      displayName: 'Anzu',
      password: validRegistration.password,
    });
    expect(response.body).toEqual({
      user: {
        id: 'user-123',
        email: 'anzu@example.com',
        displayName: 'Anzu',
        createdAt: createdAt.toISOString(),
      },
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid registration input before calling the service', async () => {
    const registerUser = vi.fn<RegisterUser>();
    const app = createTestApp(registerUser);

    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistration,
        isAdmin: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: 'INVALID_REGISTRATION_INPUT',
        message: 'Registration data is invalid',
      },
    });
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('returns conflict when the email already exists', async () => {
    const registerUser = vi.fn<RegisterUser>(async () => {
      throw new EmailAlreadyExistsError();
    });
    const app = createTestApp(registerUser);

    const response = await request(app)
      .post('/auth/register')
      .send(validRegistration);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      },
    });
  });

  it('hides unexpected implementation details', async () => {
    const registerUser = vi.fn<RegisterUser>(async () => {
      throw new Error('database password leaked in an internal message');
    });
    const app = createTestApp(registerUser);

    const response = await request(app)
      .post('/auth/register')
      .send(validRegistration);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to register user',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('database password');
  });
});
