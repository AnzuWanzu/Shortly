import { vi } from 'vitest';

import {
  DEVELOPMENT_ACCOUNTS,
  seedDevelopmentAccounts,
} from './development-seed';

describe('seedDevelopmentAccounts', () => {
  it('refuses to seed unless development seeding is explicitly enabled', async () => {
    await expect(
      seedDevelopmentAccounts(
        {
          allowDevelopmentSeed: 'false',
          nodeEnv: 'development',
          demoPassword: 'demo-password',
          pendingPassword: 'pending-password',
        },
        {
          hashPassword: vi.fn(),
          upsertUser: vi.fn(),
        },
      ),
    ).rejects.toThrow('Development seeding is disabled');
  });

  it('refuses to seed a production environment', async () => {
    await expect(
      seedDevelopmentAccounts(
        {
          allowDevelopmentSeed: 'true',
          nodeEnv: 'production',
          demoPassword: 'demo-password',
          pendingPassword: 'pending-password',
        },
        {
          hashPassword: vi.fn(),
          upsertUser: vi.fn(),
        },
      ),
    ).rejects.toThrow('Development seeding is disabled');
  });

  it('upserts one verified account and one pending account with password hashes', async () => {
    const hashPassword = vi.fn(async (password: string) => `hash:${password}`);
    const upsertUser = vi.fn(async () => undefined);

    await seedDevelopmentAccounts(
      {
        allowDevelopmentSeed: 'true',
        nodeEnv: 'development',
        demoPassword: 'demo-password',
        pendingPassword: 'pending-password',
      },
      { hashPassword, upsertUser },
    );

    expect(hashPassword).toHaveBeenNthCalledWith(1, 'demo-password');
    expect(hashPassword).toHaveBeenNthCalledWith(2, 'pending-password');
    expect(upsertUser).toHaveBeenNthCalledWith(1, {
      ...DEVELOPMENT_ACCOUNTS.demo,
      passwordHash: 'hash:demo-password',
      emailVerifiedAt: expect.any(Date),
    });
    expect(upsertUser).toHaveBeenNthCalledWith(2, {
      ...DEVELOPMENT_ACCOUNTS.pending,
      passwordHash: 'hash:pending-password',
      emailVerifiedAt: null,
    });
  });
});
