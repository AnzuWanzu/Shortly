import type { createPrismaClient } from '../../database/prisma';

type PrismaClient = ReturnType<typeof createPrismaClient>;

export function createVerificationRepository(prisma: PrismaClient) {
  return {
    findUserByEmail: (email: string) =>
      prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, emailVerifiedAt: true },
      }),

    findCodeByUserId: (userId: string) =>
      prisma.emailVerificationCode.findUnique({
        where: { userId },
        select: {
          codeDigest: true,
          expiresAt: true,
          failedAttempts: true,
          lastSentAt: true,
        },
      }),

    async replaceCode(input: {
      userId: string;
      codeDigest: string;
      expiresAt: Date;
      lastSentAt: Date;
    }) {
      await prisma.emailVerificationCode.upsert({
        where: { userId: input.userId },
        create: input,
        update: {
          codeDigest: input.codeDigest,
          expiresAt: input.expiresAt,
          failedAttempts: 0,
          lastSentAt: input.lastSentAt,
        },
      });
    },

    async incrementFailedAttempts(userId: string) {
      await prisma.emailVerificationCode.update({
        where: { userId },
        data: { failedAttempts: { increment: 1 } },
      });
    },

    async consumeCodeAndVerifyUser(userId: string, verifiedAt: Date) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: verifiedAt },
        }),
        prisma.emailVerificationCode.deleteMany({ where: { userId } }),
      ]);
    },

    async deleteCode(userId: string) {
      await prisma.emailVerificationCode.deleteMany({ where: { userId } });
    },
  };
}
