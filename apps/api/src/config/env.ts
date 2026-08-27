import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}
