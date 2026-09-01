import { parseEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://shortly:test-password@localhost:5432/shortly',
};

describe('parseEnv', () => {
  it('uses the default port when PORT is missing', () => {
    const config = parseEnv(validEnv);
    expect(config.PORT).toBe(3333);
  });

  it('converts a numeric PORT string into a number', () => {
    const config = parseEnv({ ...validEnv, PORT: '4000' });

    expect(config.PORT).toBe(4000);
    expect(typeof config.PORT).toBe('number');
  });

  it.each(['banana', '0', '65536', '3333.5'])(
    'rejects invalid PORT value %s',
    (port) => {
      expect(() => parseEnv({ ...validEnv, PORT: port })).toThrow();
    },
  );

  it('uses the local web origin when WEB_ORIGIN is missing', () => {
    const config = parseEnv(validEnv);

    expect(config.WEB_ORIGIN).toBe('http://localhost:4200');
  });

  it('accepts a configured web origin', () => {
    const config = parseEnv({
      ...validEnv,
      WEB_ORIGIN: 'https://shortly.example',
    });

    expect(config.WEB_ORIGIN).toBe('https://shortly.example');
  });

  it('rejects an invalid web origin', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        WEB_ORIGIN: 'definitely-not-a-url',
      }),
    ).toThrow();
  });

  it('rejects configuration when DATABASE_URL is missing', () => {
    expect(() => parseEnv({})).toThrow();
  });

  it('rejects a non-PostgreSQL DATABASE_URL', () => {
    expect(() =>
      parseEnv({
        ...validEnv,
        DATABASE_URL: 'https://example.com/database',
      }),
    ).toThrow();
  });

  it('keeps Secure cookies off for local HTTP by default', () => {
    const config = parseEnv(validEnv);

    expect(config.COOKIE_SECURE).toBe(false);
  });

  it('enables Secure cookies from an explicit deployment setting', () => {
    const config = parseEnv({ ...validEnv, COOKIE_SECURE: 'true' });

    expect(config.COOKIE_SECURE).toBe(true);
  });

  it('rejects an ambiguous Secure-cookie setting', () => {
    expect(() =>
      parseEnv({ ...validEnv, COOKIE_SECURE: 'sometimes' }),
    ).toThrow();
  });

  it('uses the local Redis URL when REDIS_URL is missing', () => {
    const config = parseEnv(validEnv);

    expect(config.REDIS_URL).toBe('redis://localhost:6767');
  });

  it('uses the default redirect cache TTL when it is missing', () => {
    const config = parseEnv(validEnv);

    expect(config.REDIRECT_CACHE_TTL_SECONDS).toBe(300);
  });

  it('converts the configured redirect cache TTL into a number', () => {
    const config = parseEnv({
      ...validEnv,
      REDIRECT_CACHE_TTL_SECONDS: '600',
    });

    expect(config.REDIRECT_CACHE_TTL_SECONDS).toBe(600);
    expect(typeof config.REDIRECT_CACHE_TTL_SECONDS).toBe('number');
  });

  it.each(['0', '-1', '30.5', 'banana'])(
    'rejects invalid redirect cache TTL value %s',
    (ttl) => {
      expect(() =>
        parseEnv({
          ...validEnv,
          REDIRECT_CACHE_TTL_SECONDS: ttl,
        }),
      ).toThrow();
    },
  );
});
