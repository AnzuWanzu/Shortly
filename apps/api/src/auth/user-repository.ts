import type { CreatedUser, CreateUserInput } from './registration-service';

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
    return prismaCreateUser({
      data: input,
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  };
}
