export const DEVELOPMENT_ACCOUNTS = {
  demo: {
    email: 'demo@shortly.test',
    displayName: 'Shortly Demo',
  },
  pending: {
    email: 'pending@shortly.test',
    displayName: 'Shortly Pending',
  },
} as const;

type SeedEnvironment = {
  allowDevelopmentSeed?: string;
  nodeEnv?: string;
  demoPassword?: string;
  pendingPassword?: string;
};

type SeedUserInput = {
  email: string;
  displayName: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
};

type SeedDependencies = {
  hashPassword: (password: string) => Promise<string>;
  upsertUser: (input: SeedUserInput) => Promise<void>;
};

export async function seedDevelopmentAccounts(
  _environment: SeedEnvironment,
  _dependencies: SeedDependencies,
): Promise<void> {
  throw new Error('Not implemented');
}
