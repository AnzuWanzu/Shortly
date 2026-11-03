import { redirectSlugSchema } from './redirect-schema';

describe('redirectSlugSchema', () => {
  it('accepts an eight-character Base64url slug', () => {
    expect(redirectSlugSchema.parse('abc123_-')).toBe('abc123_-');
  });

  it.each(['short', 'abc 123!', 'abc12345678901234'])(
    'rejects malformed slug %s',
    (slug) => {
      expect(() => redirectSlugSchema.parse(slug)).toThrow();
    },
  );
});
