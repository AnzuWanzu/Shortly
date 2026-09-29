export class EmailVerificationCodeInvalidError extends Error {}

export function createEmailVerificationService(_dependencies: unknown) {
  return {
    issueVerification: async (_user: unknown) => {
      throw new Error('Not implemented');
    },
    verifyEmail: async (_input: unknown) => {
      throw new Error('Not implemented');
    },
    resendVerification: async (_email: string) => {
      throw new Error('Not implemented');
    },
  };
}
