import { parseEnv } from './env';

describe('parseEnv', () => {
  it('uses the default port when PORT is missing', () => {
    const config = parseEnv({});
    expect(config.PORT).toBe(3333);
  });

  it('converts a numeric PORT string into a number', () => {
    const config = parseEnv({ PORT: '4000' });

    expect(config.PORT).toBe(4000);
    expect(typeof config.PORT).toBe('number');
  });

  it.each(['banana', '0', '65536', '3333.5'])(
    'rejects invalid PORT value %s',
    (port) => {
      expect(() => parseEnv({ PORT: port })).toThrow();
    },
  );

  it('uses the local web origin when WEB_ORIGIN is missing', () => {
    const config = parseEnv({});

    expect(config.WEB_ORIGIN).toBe('http://localhost:4200');
  });

  it('accepts a configured web origin', () => {
    const config = parseEnv({
      WEB_ORIGIN: 'https://shortly.example',
    });

    expect(config.WEB_ORIGIN).toBe('https://shortly.example');
  });

  it('rejects an invalid web origin', () => {
    expect(() =>
      parseEnv({
        WEB_ORIGIN: 'definitely-not-a-url',
      }),
    ).toThrow();
  });
});
