import { hashPassword, verifyPassword } from './password-hasher';

describe('hashPassword', () => {
  it('returns something different from the plaintext password', async () => {
    const password = 'i-am-not-a-chud';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
  });

  it('creates different hashes for the same password', async () => {
    const password = 'i-am-not-a-chud';

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
  });
});

describe('verifyPassword', () => {
  it('accepts the correct password', async () => {
    const password = 'i-am-not-a-chud';
    const passwordHash = await hashPassword(password);

    const matches = await verifyPassword(passwordHash, password);

    expect(matches).toBe(true);
  });

  it('rejects the correct password', async () => {
    const password = 'i-am-not-a-chud';
    const passwordHash = await hashPassword(password);

    const matches = await verifyPassword(
      passwordHash,
      'definitely-the-wrong-password',
    );

    expect(matches).toBe(false);
  });
});
