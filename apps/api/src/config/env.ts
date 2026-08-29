import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),

  WEB_ORIGIN: z
    .url({
      protocol: /^https?$/,
    })
    .default('http://localhost:4200'),

  DATABASE_URL: z.url({
    protocol: /^postgresql$/,
  }),

  COOKIE_SECURE: z.unknown().optional(),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}
