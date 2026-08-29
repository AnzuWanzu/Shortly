import { argon2id, hash, verify } from 'argon2';
import type { HashOptions } from 'argon2';

const passwordHashOptions: HashOptions = {
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

// A public, non-secret hash used to make unknown-email logins perform the same
// expensive Argon2 verification step as known-email logins.
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$uuD/qzJvRrFKoUGoBAneeQ$qLF6p7aN5EL+0kPO+Mam9Ywy6Gdx8V4vNxilh+Bk3DY';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, passwordHashOptions);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
