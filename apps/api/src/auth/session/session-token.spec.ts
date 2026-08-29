import { createSessionToken, hashSessionToken } from './session-token';

describe('createSessionToken', () => {
  it('creates a URL-safe token with 256 bits of randomness', () => {
    const token = createSessionToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('creates a different token each time', () => {
    expect(createSessionToken()).not.toBe(createSessionToken());
  });
});

describe('hashSessionToken', () => {
  it('creates a deterministic 64-character SHA-256 digest', () => {
    const token = 'a-private-session-token';

    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toContain(token);
  });
});
