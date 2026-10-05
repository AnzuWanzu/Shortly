export const EMAIL_VERIFICATION_EXPIRY_MINUTES = 10;
export const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

export class EmailVerificationCodeInvalidError extends Error {
  constructor() {
    super('Verification code is invalid or expired');
    this.name = 'EmailVerificationCodeInvalidError';
  }
}

export type VerificationUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
};

type StoredVerificationCode = {
  codeDigest: string;
  expiresAt: Date;
  failedAttempts: number;
  lastSentAt: Date;
};

type VerificationDependencies = {
  now: () => Date;
  generateCode: () => string;
  digestCode: (userId: string, code: string) => string;
  matchesCode: (digest: string, userId: string, code: string) => boolean;
  replaceCode: (input: {
    userId: string;
    codeDigest: string;
    expiresAt: Date;
    lastSentAt: Date;
  }) => Promise<void>;
  findUserByEmail: (email: string) => Promise<VerificationUser | null>;
  findCodeByUserId: (userId: string) => Promise<StoredVerificationCode | null>;
  incrementFailedAttempts: (userId: string) => Promise<void>;
  consumeCodeAndVerifyUser: (userId: string, verifiedAt: Date) => Promise<void>;
  deleteCode: (userId: string) => Promise<void>;
  sendVerificationEmail: (input: {
    email: string;
    code: string;
    expiresInMinutes: number;
  }) => Promise<void>;
};

export function createEmailVerificationService(
  dependencies: VerificationDependencies,
) {
  async function issueVerification(user: VerificationUser) {
    const sentAt = dependencies.now();
    const code = dependencies.generateCode();

    await dependencies.replaceCode({
      userId: user.id,
      codeDigest: dependencies.digestCode(user.id, code),
      expiresAt: new Date(
        sentAt.getTime() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60_000,
      ),
      lastSentAt: sentAt,
    });

    try {
      await dependencies.sendVerificationEmail({
        email: user.email,
        code,
        expiresInMinutes: EMAIL_VERIFICATION_EXPIRY_MINUTES,
      });
      return { emailSent: true };
    } catch {
      return { emailSent: false };
    }
  }

  async function verifyEmail(input: { email: string; code: string }) {
    const user = await dependencies.findUserByEmail(input.email);
    if (!user) throw new EmailVerificationCodeInvalidError();
    if (user.emailVerifiedAt) return;

    const storedCode = await dependencies.findCodeByUserId(user.id);
    if (!storedCode) throw new EmailVerificationCodeInvalidError();

    const currentTime = dependencies.now();
    if (
      storedCode.expiresAt <= currentTime ||
      storedCode.failedAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS
    ) {
      await dependencies.deleteCode(user.id);
      throw new EmailVerificationCodeInvalidError();
    }

    if (!dependencies.matchesCode(storedCode.codeDigest, user.id, input.code)) {
      if (storedCode.failedAttempts + 1 >= EMAIL_VERIFICATION_MAX_ATTEMPTS) {
        await dependencies.deleteCode(user.id);
      } else {
        await dependencies.incrementFailedAttempts(user.id);
      }
      throw new EmailVerificationCodeInvalidError();
    }

    await dependencies.consumeCodeAndVerifyUser(user.id, currentTime);
  }

  async function resendVerification(email: string) {
    const user = await dependencies.findUserByEmail(email);
    if (!user || user.emailVerifiedAt) return;

    const storedCode = await dependencies.findCodeByUserId(user.id);
    const currentTime = dependencies.now();
    if (
      storedCode &&
      currentTime.getTime() - storedCode.lastSentAt.getTime() <
        EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      return;
    }

    await issueVerification(user);
  }

  return { issueVerification, verifyEmail, resendVerification };
}
