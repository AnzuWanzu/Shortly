import { createVerificationCodeDigester } from './verification-code';

describe('verificationCode', () => {
  it('matches only the original user and code', () => {
    const digester = createVerificationCodeDigester('a'.repeat(32));
    const digest = digester.digestCode('user-1', '123456');

    expect(digester.matchesCode(digest, 'user-1', '123456')).toBe(true);
    expect(digester.matchesCode(digest, 'user-1', '654321')).toBe(false);
    expect(digester.matchesCode(digest, 'user-2', '123456')).toBe(false);
  });
});
