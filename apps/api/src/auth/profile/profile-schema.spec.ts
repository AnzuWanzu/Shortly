import { profileUpdateSchema } from './profile-schema';

describe('profileUpdateSchema', () => {
  it('trims a valid display name', () => {
    expect(
      profileUpdateSchema.parse({ displayName: '  Anzu Prime  ' }),
    ).toEqual({ displayName: 'Anzu Prime' });
  });

  it.each(['', 'x'.repeat(101)])('rejects invalid display name %s', (name) => {
    expect(() => profileUpdateSchema.parse({ displayName: name })).toThrow();
  });

  it('rejects a client-selected user ID', () => {
    expect(() =>
      profileUpdateSchema.parse({
        displayName: 'Anzu Prime',
        userId: 'attacker-selected-user',
      }),
    ).toThrow();
  });
});
