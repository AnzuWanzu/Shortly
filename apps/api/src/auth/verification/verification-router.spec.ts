import express from 'express';
import request from 'supertest';
import { vi } from 'vitest';

import { createVerificationRouter } from './verification-router';

function createTestApp(dependencies: {
  verifyEmail: (input: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}) {
  const app = express();
  app.use(express.json());
  app.use('/auth', createVerificationRouter(dependencies));
  return app;
}

describe('verificationRouter', () => {
  it('verifies a valid six-digit code', async () => {
    const verifyEmail = vi.fn(async () => undefined);
    const response = await request(
      createTestApp({ verifyEmail, resendVerification: vi.fn() }),
    )
      .post('/auth/verify-email')
      .set('x-shortly-csrf', '1')
      .send({ email: ' Anzu@Example.com ', code: '123456' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ verified: true });
    expect(verifyEmail).toHaveBeenCalledWith({
      email: 'anzu@example.com',
      code: '123456',
    });
  });

  it('returns a generic invalid-code response', async () => {
    const { EmailVerificationCodeInvalidError } = await import(
      './verification-service'
    );
    const verifyEmail = vi.fn(async () => {
      throw new EmailVerificationCodeInvalidError();
    });
    const response = await request(
      createTestApp({ verifyEmail, resendVerification: vi.fn() }),
    )
      .post('/auth/verify-email')
      .set('x-shortly-csrf', '1')
      .send({ email: 'anzu@example.com', code: '999999' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_VERIFICATION_CODE');
  });

  it('uses the same accepted response for every resend request', async () => {
    const resendVerification = vi.fn(async () => undefined);
    const response = await request(
      createTestApp({ verifyEmail: vi.fn(), resendVerification }),
    )
      .post('/auth/resend-verification')
      .set('x-shortly-csrf', '1')
      .send({ email: 'unknown@example.com' });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ accepted: true });
  });

  it('rate-limits repeated verification attempts from one client', async () => {
    const verifyEmail = vi.fn(async () => undefined);
    const app = createTestApp({
      verifyEmail,
      resendVerification: vi.fn(),
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post('/auth/verify-email')
        .set('x-shortly-csrf', '1')
        .send({ email: 'anzu@example.com', code: '123456' });
      expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app)
      .post('/auth/verify-email')
      .set('x-shortly-csrf', '1')
      .send({ email: 'anzu@example.com', code: '123456' });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body.error.code).toBe(
      'TOO_MANY_VERIFICATION_ATTEMPTS',
    );
    expect(verifyEmail).toHaveBeenCalledTimes(10);
  });
});
