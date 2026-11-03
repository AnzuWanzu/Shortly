import { z } from 'zod';

export const verifyEmailSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must contain exactly six digits'),
});

export const resendVerificationSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email(),
});
