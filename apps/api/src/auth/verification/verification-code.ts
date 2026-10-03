import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function createVerificationCodeDigester(secret: string) {
  function digestCode(userId: string, code: string): string {
    return createHmac('sha256', secret)
      .update(`${userId}:${code}`)
      .digest('hex');
  }

  function matchesCode(
    expectedDigest: string,
    userId: string,
    code: string,
  ): boolean {
    const actualDigest = digestCode(userId, code);
    const expected = Buffer.from(expectedDigest, 'hex');
    const actual = Buffer.from(actualDigest, 'hex');

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  return { digestCode, matchesCode };
}
