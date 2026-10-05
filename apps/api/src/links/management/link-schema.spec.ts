import { createLinkSchema, linkIdSchema } from './link-schema';

describe('createLinkSchema', () => {
  it('accepts an HTTP or HTTPS destination', () => {
    expect(
      createLinkSchema.parse({ originalUrl: 'https://example.com/very/long' }),
    ).toEqual({ originalUrl: 'https://example.com/very/long' });
  });

  it.each([
    ['a non-URL', { originalUrl: 'definitely-not-a-url' }],
    ['a non-web protocol', { originalUrl: 'javascript:alert(1)' }],
    [
      'a client-selected owner',
      { originalUrl: 'https://example.com', userId: 'attacker-user' },
    ],
  ])('rejects %s', (_caseName, input) => {
    expect(() => createLinkSchema.parse(input)).toThrow();
  });
});

describe('linkIdSchema', () => {
  it('accepts a UUID and rejects an arbitrary identifier', () => {
    expect(linkIdSchema.parse('8ef22366-a9ce-4ebd-8c11-59779bcd66f4')).toBe(
      '8ef22366-a9ce-4ebd-8c11-59779bcd66f4',
    );
    expect(() => linkIdSchema.parse('not-a-uuid')).toThrow();
  });
});
