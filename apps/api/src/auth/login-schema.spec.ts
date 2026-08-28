import { loginSchema } from './login-schema';

describe('loginSchema', () => {
  it('normalizes the email without changing the password', () => {
    const result = loginSchema.parse({
      email: '  ANZU@Example.COM ',
      password: '  spaces are part of this password  ',
    });

    expect(result).toEqual({
      email: 'anzu@example.com',
      password: '  spaces are part of this password  ',
    });
  });

  it.each([
    ['an invalid email', { email: 'not-an-email', password: 'password' }],
    ['a blank password', { email: 'anzu@example.com', password: '' }],
    [
      'an undeclared privilege field',
      { email: 'anzu@example.com', password: 'password', isAdmin: true },
    ],
  ])('rejects %s', (_caseName, input) => {
    expect(() => loginSchema.parse(input)).toThrow();
  });
});
