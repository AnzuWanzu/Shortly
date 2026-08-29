import type { LoginInput } from './login-schema';
import { InvalidCredentialsError } from './auth-errors';

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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

export type LoginUser = (input: LoginInput) => Promise<LoginResult>;

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

export function createLoginUser(dependencies: LoginDependencies) {
  return async function loginUser(input: LoginInput): Promise<LoginResult> {
    const user = await dependencies.findUserByEmail(input.email);
    const passwordHash = user?.passwordHash ?? dependencies.dummyPasswordHash;
    const passwordMatches = await dependencies.verifyPassword(
      passwordHash,
      input.password,
    );

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const token = dependencies.createSessionToken();
    const tokenHash = dependencies.hashSessionToken(token);
    const expiresAt = new Date(
      dependencies.now().getTime() + dependencies.sessionDurationMs,
    );

    await dependencies.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
      token,
      expiresAt,
    };
  };
}
