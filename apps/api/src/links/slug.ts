import { randomBytes } from 'node:crypto';

export function createSlug(): string {
  return randomBytes(6).toString('base64url');
}
