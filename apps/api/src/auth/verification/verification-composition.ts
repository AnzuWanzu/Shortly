import type { createPrismaClient } from '../../database/prisma';
import {
  createVerificationCodeDigester,
  generateVerificationCode,
} from './verification-code';
import { createVerificationEmailSender } from './verification-email';
import { createVerificationRepository } from './verification-repository';
import { createEmailVerificationService } from './verification-service';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function composeEmailVerification(
  prisma: PrismaClient,
  input: { smtpUrl: string; emailFrom: string; secret: string },
) {
  const repository = createVerificationRepository(prisma);
  const digester = createVerificationCodeDigester(input.secret);

  return createEmailVerificationService({
    now: () => new Date(),
    generateCode: generateVerificationCode,
    ...digester,
    ...repository,
    sendVerificationEmail: createVerificationEmailSender(
      input.smtpUrl,
      input.emailFrom,
    ),
  });
}
