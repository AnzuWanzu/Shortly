import type { LoginInput } from './login-schema';

export type LoginUserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
};

export type AuthenticatedUser = Omit<LoginUserRecord, 'passwordHash'>;

export type CreateSessionInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type LoginResult = {
  user: AuthenticatedUser;
  token: string;
  expiresAt: Date;
};

type LoginDependencies = {
  findUserByEmail: (email: string) => Promise<LoginUserRecord | null>;
  verifyPassword: (
    passwordHash: string,
    submittedPassword: string,
  ) => Promise<boolean>;
  createSession: (input: CreateSessionInput) => Promise<void>;
  createSessionToken: () => string;
  hashSessionToken: (token: string) => string;
  now: () => Date;
  sessionDurationMs: number;
  dummyPasswordHash: string;
};

export function createLoginUser(_dependencies: LoginDependencies) {
  return async function loginUser(_input: LoginInput): Promise<LoginResult> {
    throw new Error('Not implemented');
  };
}
