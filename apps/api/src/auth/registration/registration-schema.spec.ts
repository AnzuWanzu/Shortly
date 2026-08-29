import { registrationSchema } from './registration-schema';

const validRegistration = {
  email: 'anzu@example.com',
  displayName: 'Anzu',
  password: 'i am not a chud',
};

describe('registrationSchema', () => {
  it('normalizes a valid registration request', () => {
    const result = registrationSchema.parse({
      email: '  ANZU@Example.COM ',
      displayName: '  Anzu  ',
      password: 'i am not a chud',
    });

    expect(result).toEqual({
      email: 'anzu@example.com',
      displayName: 'Anzu',
      password: 'i am not a chud',
    });
  });

  it.each([
    ['an invalid email', { ...validRegistration, email: 'not-an-email' }],
    ['a blank display name', { ...validRegistration, displayName: '   ' }],
    [
      'a password shorter than 15 characters',
      { ...validRegistration, password: 'too-short' },
    ],
    ['an undeclared privilege field', { ...validRegistration, isAdmin: true }],
  ])('rejects %s', (_caseName, input) => {
    expect(() => registrationSchema.parse(input)).toThrow();
  });
});
