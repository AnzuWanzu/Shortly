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
  environment: SeedEnvironment,
  dependencies: SeedDependencies,
): Promise<void> {
  if (
    environment.allowDevelopmentSeed !== 'true' ||
    environment.nodeEnv === 'production'
  ) {
    throw new Error('Development seeding is disabled');
  }

  if (!environment.demoPassword || !environment.pendingPassword) {
    throw new Error('Development seed passwords are required');
  }

  const [demoPasswordHash, pendingPasswordHash] = await Promise.all([
    dependencies.hashPassword(environment.demoPassword),
    dependencies.hashPassword(environment.pendingPassword),
  ]);

  await dependencies.upsertUser({
    ...DEVELOPMENT_ACCOUNTS.demo,
    passwordHash: demoPasswordHash,
    emailVerifiedAt: new Date(),
  });
  await dependencies.upsertUser({
    ...DEVELOPMENT_ACCOUNTS.pending,
    passwordHash: pendingPasswordHash,
    emailVerifiedAt: null,
  });
}
