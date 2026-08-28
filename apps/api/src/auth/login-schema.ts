import { z } from 'zod';

export const loginSchema = z.strictObject({
  email: z.string(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
