import type { CreatedUser, CreateUserInput } from './registration-service';
import { EmailAlreadyExistsError } from './auth-errors';

type SafeUserSelection = {
  id: true;
  email: true;
  displayName: true;
  createdAt: true;
};

type PrismaCreateUserArgs = {
  data: CreateUserInput;
  select: SafeUserSelection;
};

type PrismaCreateUser = (args: PrismaCreateUserArgs) => Promise<CreatedUser>;

export function createUserRepository(prismaCreateUser: PrismaCreateUser) {
  return async function createUser(
    input: CreateUserInput,
  ): Promise<CreatedUser> {
    try {
      return await prismaCreateUser({
        data: input,
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (isErrorWithCode(error, 'P2002')) {
        throw new EmailAlreadyExistsError();
      }

      throw error;
    }
  };
}

function isErrorWithCode(
  error: unknown,
  expectedCode: string,
): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === expectedCode
  );
}
