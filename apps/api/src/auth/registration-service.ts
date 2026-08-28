import type { RegistrationInput } from './registration-schema';

type CreateUserInput = {
  email: string;
  displayName: string;
  passwordHash: string;
};

type CreatedUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
};

type RegistrationDependencies = {
  hashPassword: (password: string) => Promise<string>;
  createUser: (input: CreateUserInput) => Promise<CreatedUser>;
};

export function createRegisterUser({
  hashPassword,
  createUser,
}: RegistrationDependencies) {
  return async function registerUser(
    input: RegistrationInput,
  ): Promise<CreatedUser> {
    const passwordHash = await hashPassword(input.password);

    return createUser({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
    });
  };
}
