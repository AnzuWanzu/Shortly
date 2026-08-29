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

  it('accepts an eight-character password', () => {
    expect(
      registrationSchema.parse({ ...validRegistration, password: 'eight888' }),
    ).toMatchObject({ password: 'eight888' });
  });

  it.each([
    ['an invalid email', { ...validRegistration, email: 'not-an-email' }],
    ['a blank display name', { ...validRegistration, displayName: '   ' }],
    [
      'a password shorter than 8 characters',
      { ...validRegistration, password: 'short77' },
    ],
    ['an undeclared privilege field', { ...validRegistration, isAdmin: true }],
  ])('rejects %s', (_caseName, input) => {
    expect(() => registrationSchema.parse(input)).toThrow();
  });
});
