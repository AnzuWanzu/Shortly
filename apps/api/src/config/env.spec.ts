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
});
