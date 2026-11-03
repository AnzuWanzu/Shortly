import { vi } from 'vitest';

import {
  EmailVerificationCodeInvalidError,
  createEmailVerificationService,
} from './verification-service';

const now = new Date('2026-09-29T12:00:00.000Z');
const user = {
  id: 'ed424dee-266a-4a88-9f9e-8f3a80b84db8',
  email: 'anzu@example.com',
  emailVerifiedAt: null,
};

function createDependencies() {
  return {
    now: vi.fn(() => now),
    generateCode: vi.fn(() => '123456'),
    digestCode: vi.fn(() => 'code-digest'),
    matchesCode: vi.fn(() => true),
    replaceCode: vi.fn(async () => undefined),
    findUserByEmail: vi.fn(async () => user),
    findCodeByUserId: vi.fn(async () => ({
      codeDigest: 'stored-digest',
      expiresAt: new Date(now.getTime() + 60_000),
      failedAttempts: 0,
      lastSentAt: new Date(now.getTime() - 60_000),
    })),
    incrementFailedAttempts: vi.fn(async () => undefined),
    consumeCodeAndVerifyUser: vi.fn(async () => undefined),
    deleteCode: vi.fn(async () => undefined),
    sendVerificationEmail: vi.fn(async () => undefined),
  };
}

describe('emailVerificationService', () => {
  it('stores a digest and emails the plain six-digit code', async () => {
    const dependencies = createDependencies();
    const service = createEmailVerificationService(dependencies);

    await service.issueVerification(user);

    expect(dependencies.replaceCode).toHaveBeenCalledWith({
      userId: user.id,
      codeDigest: 'code-digest',
      expiresAt: new Date(now.getTime() + 10 * 60_000),
      lastSentAt: now,
    });
    expect(dependencies.sendVerificationEmail).toHaveBeenCalledWith({
      email: user.email,
      code: '123456',
      expiresInMinutes: 10,
    });
  });

  it('consumes a valid code and verifies the user', async () => {
    const dependencies = createDependencies();
    const service = createEmailVerificationService(dependencies);

    await service.verifyEmail({ email: user.email, code: '123456' });

    expect(dependencies.matchesCode).toHaveBeenCalledWith(
      'stored-digest',
      user.id,
      '123456',
    );
    expect(dependencies.consumeCodeAndVerifyUser).toHaveBeenCalledWith(
      user.id,
      now,
    );
  });

  it('counts an incorrect code without verifying the user', async () => {
    const dependencies = createDependencies();
    dependencies.matchesCode.mockReturnValue(false);
    const service = createEmailVerificationService(dependencies);

    await expect(
      service.verifyEmail({ email: user.email, code: '999999' }),
    ).rejects.toBeInstanceOf(EmailVerificationCodeInvalidError);

    expect(dependencies.incrementFailedAttempts).toHaveBeenCalledWith(user.id);
    expect(dependencies.consumeCodeAndVerifyUser).not.toHaveBeenCalled();
  });

  it('invalidates an expired code', async () => {
    const dependencies = createDependencies();
    dependencies.findCodeByUserId.mockResolvedValue({
      codeDigest: 'stored-digest',
      expiresAt: new Date(now.getTime() - 1),
      failedAttempts: 0,
      lastSentAt: new Date(now.getTime() - 60_000),
    });
    const service = createEmailVerificationService(dependencies);

    await expect(
      service.verifyEmail({ email: user.email, code: '123456' }),
    ).rejects.toBeInstanceOf(EmailVerificationCodeInvalidError);
    expect(dependencies.deleteCode).toHaveBeenCalledWith(user.id);
  });

  it('silently skips resend during the cooldown', async () => {
    const dependencies = createDependencies();
    dependencies.findCodeByUserId.mockResolvedValue({
      codeDigest: 'stored-digest',
      expiresAt: new Date(now.getTime() + 60_000),
      failedAttempts: 0,
      lastSentAt: new Date(now.getTime() - 30_000),
    });
    const service = createEmailVerificationService(dependencies);

    await service.resendVerification(user.email);

    expect(dependencies.replaceCode).not.toHaveBeenCalled();
    expect(dependencies.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
