import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(320));

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'Code must contain exactly six digits'),
});

export const resendVerificationSchema = z.object({ email: emailSchema });
