import { z } from 'zod';

export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
