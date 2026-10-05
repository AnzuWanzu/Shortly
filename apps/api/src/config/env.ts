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

  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  REDIS_URL: z
    .url({
      protocol: /^rediss?$/,
    })
    .default('redis://localhost:6767'),

  REDIRECT_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  SMTP_URL: z.url({ protocol: /^smtps?$/ }),
  EMAIL_FROM: z.string().trim().min(1).max(320),
  EMAIL_VERIFICATION_SECRET: z.string().min(32),
});

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}
