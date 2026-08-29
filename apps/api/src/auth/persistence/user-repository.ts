import type {
  CreatedUser,
  CreateUserInput,
} from '../registration/registration-service';
import type { LoginUserRecord } from '../login/login-service';
import type { AuthenticatedUser } from '../login/login-service';
import type { UpdateProfileInput } from '../profile/profile-service';
import { EmailAlreadyExistsError } from '../shared/auth-errors';

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

type LoginUserSelection = {
  id: true;
  email: true;
  displayName: true;
  passwordHash: true;
  createdAt: true;
};

type PrismaFindUserArgs = {
  where: { email: string };
  select: LoginUserSelection;
};

type PrismaFindUser = (
  args: PrismaFindUserArgs,
) => Promise<LoginUserRecord | null>;

type PrismaUpdateUser = (args: {
  where: { id: string };
  data: { displayName: string };
  select: SafeUserSelection;
}) => Promise<AuthenticatedUser>;

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

export function createFindUserByEmailRepository(
  prismaFindUser: PrismaFindUser,
) {
  return async function findUserByEmail(
    email: string,
  ): Promise<LoginUserRecord | null> {
    return prismaFindUser({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        createdAt: true,
      },
    });
  };
}

export function createUpdateUserProfileRepository(
  _prismaUpdateUser: PrismaUpdateUser,
) {
  return async function updateUserProfile(
    _input: UpdateProfileInput,
  ): Promise<AuthenticatedUser> {
    throw new Error('Not implemented');
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
