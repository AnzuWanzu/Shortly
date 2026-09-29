import type { RegistrationInput } from './registration-schema';

export type CreateUserInput = {
  email: string;
  displayName: string;
  passwordHash: string;
};

export type CreatedUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  emailVerifiedAt: Date | null;
};

export type RegistrationResult = {
  user: CreatedUser;
  verificationRequired: true;
  emailSent: boolean;
};

type RegistrationDependencies = {
  hashPassword: (password: string) => Promise<string>;
  createUser: (input: CreateUserInput) => Promise<CreatedUser>;
  issueVerification: (user: CreatedUser) => Promise<{ emailSent: boolean }>;
};

export function createRegisterUser({
  hashPassword,
  createUser,
  issueVerification,
}: RegistrationDependencies) {
  return async function registerUser(
    input: RegistrationInput,
  ): Promise<RegistrationResult> {
    const passwordHash = await hashPassword(input.password);

    const user = await createUser({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });

    const { emailSent } = await issueVerification(user);
    return { user, verificationRequired: true, emailSent };
  };
}
